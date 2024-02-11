import { zodResolver } from "@hookform/resolvers/zod";
import { Autocomplete, Stack, TextField } from "@mui/material";
import { useCallback, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  useCriteria,
  useProblems,
  useQuestions,
  useSolutions,
} from "../../../topic/store/nodeHooks";
import { setFilterOptions, useFilterOptions } from "../../navigateStore";
import {
  FilterTypes,
  exploreFilterTypes,
  filterOptionsSchema,
  filterSchemas,
  topicFilterTypes,
} from "../../utils/filter";

type ValidatedFormData = z.infer<typeof filterOptionsSchema>;

// how to build this based on schemas? .merge doesn't work because `type` is overridden by the last schema's literal
interface FormData {
  type: FilterTypes;
  centralProblemId?: string;
  detail: "all" | "connectedToCriteria" | "none";
  solutions: string[];
  criteria: string[];
  centralQuestionId?: string;
}

/**
 * Helper to grab properties from an object whose type isn't narrow enough to know that the property exists.
 *
 * @returns the value of the property if the object exists with it, otherwise the default value
 */
const getProp = <T,>(obj: object | null, prop: string, defaultValue: T): T => {
  if (!obj || !(prop in obj)) return defaultValue;
  const value = (obj as Record<string, T>)[prop];
  return value ?? defaultValue;
};

interface Props {
  activeView: "topicDiagram" | "exploreDiagram";
}

/**
 * Features:
 * - Tracks filter options per diagram, so that you can quickly switch between diagrams without losing filter
 * - Reuses field values across filters (e.g. central problem retains value when switching filter type)
 * - Defaults field values based on nodes that exist in the diagram
 * - Shows field components and validates based on filter type
 */
export const FilterOptions = ({ activeView }: Props) => {
  const filterOptions = useFilterOptions(activeView);
  const problems = useProblems(); // could consider selecting causes here, but probably don't want causes as options for solutions filter
  const questions = useQuestions();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(filterOptionsSchema),
    defaultValues: {
      type: filterOptions.type,
      centralProblemId: getProp<string | undefined>(
        filterOptions,
        "centralProblemId",
        problems[0]?.id
      ),
      detail: getProp<"all" | "connectedToCriteria" | "none">(filterOptions, "detail", "all"),
      solutions: getProp<string[]>(filterOptions, "solutions", []),
      // TODO?: ideally this defaults to all criteria so that empty can mean no criteria displayed,
      // but we can't rely on `watch("centralProblemId")` with `useCriteria(centralProblemId)` since
      // watch isn't usable until after form definition. Potentially could move all defaults to
      // be specified on their component, but that's annoying and we'd also have to handle the first
      // render, during which `watch` is undefined.
      criteria: getProp<string[]>(filterOptions, "criteria", []),
      centralQuestionId: getProp<string | undefined>(
        filterOptions,
        "centralQuestionId",
        questions[0]?.id
      ),
    },
  });

  const filterTypes = activeView === "topicDiagram" ? topicFilterTypes : exploreFilterTypes;

  const type = watch("type");
  const typeSchemaShape = filterSchemas[type].shape;

  // TODO?: maybe worth extracting a component per field? but a lot is coupled... maybe best would be
  // to extract a NodeAutocomplete component, since these are all autocompletes
  const centralProblemId = watch("centralProblemId");
  const centralProblemOptions = useMemo(() => {
    return problems.map((problem) => ({ label: problem.data.label, id: problem.id }));
  }, [problems]);
  const centralProblemValue = useMemo(() => {
    const value = centralProblemOptions.find((option) => option.id === centralProblemId);
    if (centralProblemId && !value) setValue("centralProblemId", centralProblemOptions[0]?.id); // if node is deleted, make sure we don't retain the deleted id to make the form think it's valid
    return value ?? centralProblemOptions[0];
  }, [centralProblemId, centralProblemOptions, setValue]);

  const solutions = useSolutions(centralProblemId);
  const selectedSolutions = watch("solutions");
  const solutionOptions = useMemo(() => {
    return solutions.map((solution) => ({ label: solution.data.label, id: solution.id }));
  }, [solutions]);
  const solutionValues = useMemo(() => {
    return solutionOptions.filter((option) => selectedSolutions.includes(option.id));
  }, [selectedSolutions, solutionOptions]);

  const criteria = useCriteria(centralProblemId);
  const selectedCriteria = watch("criteria");
  const criteriaOptions = useMemo(() => {
    return criteria.map((criterion) => ({ label: criterion.data.label, id: criterion.id }));
  }, [criteria]);
  const criteriaValues = useMemo(() => {
    return criteriaOptions.filter((option) => selectedCriteria.includes(option.id));
  }, [selectedCriteria, criteriaOptions]);

  const centralQuestionId = watch("centralQuestionId");
  const centralQuestionOptions = useMemo(() => {
    return questions.map((question) => ({ label: question.data.label, id: question.id }));
  }, [questions]);
  const centralQuestionValue = useMemo(() => {
    const value = centralQuestionOptions.find((option) => option.id === centralQuestionId);
    if (centralQuestionId && !value) setValue("centralQuestionId", centralQuestionOptions[0]?.id); // if node is deleted, make sure we don't retain the deleted id to make the form think it's valid
    return value ?? centralQuestionOptions[0];
  }, [centralQuestionId, centralQuestionOptions, setValue]);

  const submit = useCallback(() => {
    void handleSubmit((data) => {
      // We know that zod has validated the data by this point.
      // `FormData` is used for the form's data type so that form `errors` type has all props;
      // without this, `errors` only knows the props that intersect all the schemas, i.e. `type`.
      setFilterOptions(data as ValidatedFormData);
    })();
  }, [handleSubmit]);

  // TODO?: can form onBlur be used to submit when any input changes?
  return (
    <form style={{ padding: "8px" }}>
      <Stack spacing={1.5}>
        {/* GitHub code search found this example implementing Mui Autocomplete with react-hook-form https://github.com/GeoWerkstatt/ews-boda/blob/79cb1484db53170aace5a4b01ed1f9c56269f7c4/src/ClientApp/src/components/SchichtForm.js#L126-L153 */}
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={filterTypes}
              onChange={(_event, value) => {
                field.onChange(value);
                submit(); // how otherwise to ensure submit happens on change of any form input?
              }}
              disableClearable
              renderInput={(params) => <TextField {...params} label="Filter" />}
              size="small"
            />
          )}
        />
        {"centralProblemId" in filterSchemas[type].shape && (
          <Controller
            control={control}
            name="centralProblemId"
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={centralProblemOptions}
                value={centralProblemValue}
                onChange={(_event, value) => {
                  if (!value) return;
                  field.onChange(value.id);
                  submit();
                }}
                disableClearable={centralProblemValue !== undefined}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Central Problem"
                    error={!!errors.centralProblemId}
                    helperText={errors.centralProblemId?.message}
                  />
                )}
                // required to avoid duplicate key error if two nodes have the same text https://github.com/mui/material-ui/issues/26492#issuecomment-901089142
                renderOption={(props, option) => {
                  return (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  );
                }}
                size="small"
              />
            )}
          />
        )}
        {"detail" in typeSchemaShape && (
          <Controller
            control={control}
            name="detail"
            render={({ field }) => (
              <Autocomplete
                {...field}
                // TODO: build options with Pascal Case
                options={typeSchemaShape.detail.options.map((option) => option.value)}
                onChange={(_event, value) => {
                  field.onChange(value);
                  submit();
                }}
                disableClearable
                renderInput={(params) => <TextField {...params} label="Detail" />}
                size="small"
              />
            )}
          />
        )}
        {"solutions" in filterSchemas[type].shape && (
          <Controller
            control={control}
            name="solutions"
            render={({ field }) => (
              <Autocomplete
                {...field}
                multiple
                disableCloseOnSelect
                options={solutionOptions}
                value={solutionValues}
                onChange={(_event, values) => {
                  field.onChange(values.map((value) => value.id));
                  submit();
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Solutions"
                    error={!!errors.solutions}
                    helperText={errors.solutions?.message}
                  />
                )}
                // required to avoid duplicate key error if two nodes have the same text https://github.com/mui/material-ui/issues/26492#issuecomment-901089142
                renderOption={(props, option) => {
                  return (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  );
                }}
                size="small"
              />
            )}
          />
        )}
        {"criteria" in filterSchemas[type].shape && (
          <Controller
            control={control}
            name="criteria"
            render={({ field }) => (
              <Autocomplete
                {...field}
                multiple
                disableCloseOnSelect
                options={criteriaOptions}
                value={criteriaValues}
                onChange={(_event, values) => {
                  field.onChange(values.map((value) => value.id));
                  submit();
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Criteria"
                    error={!!errors.criteria}
                    helperText={errors.criteria?.message}
                  />
                )}
                // required to avoid duplicate key error if two nodes have the same text https://github.com/mui/material-ui/issues/26492#issuecomment-901089142
                renderOption={(props, option) => {
                  return (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  );
                }}
                size="small"
              />
            )}
          />
        )}
        {"centralQuestionId" in filterSchemas[type].shape && (
          <Controller
            control={control}
            name="centralQuestionId"
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={centralQuestionOptions}
                value={centralQuestionValue}
                onChange={(_event, value) => {
                  if (!value) return;
                  field.onChange(value.id);
                  submit();
                }}
                disableClearable={centralQuestionValue !== undefined}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Central Question"
                    error={!!errors.centralQuestionId}
                    helperText={errors.centralQuestionId?.message}
                  />
                )}
                // required to avoid duplicate key error if two nodes have the same text https://github.com/mui/material-ui/issues/26492#issuecomment-901089142
                renderOption={(props, option) => {
                  return (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  );
                }}
                size="small"
              />
            )}
          />
        )}
      </Stack>
    </form>
  );
};