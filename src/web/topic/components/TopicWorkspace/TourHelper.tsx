/**
 * This lives as a separate component so that tourProps can be used outside of the `useTour` hook,
 * for ease of use, without causing re-renders for other sibling components.
 */

import { useTour } from "@reactour/tour";
import { useEffect, useMemo } from "react";

import { useSessionUser } from "@/web/common/hooks";
import { useUserCanEditTopicData } from "@/web/topic/store/userHooks";
import { setReactTourProps } from "@/web/tour/reactourWrapper";
import { startFirstTour } from "@/web/tour/tour";
import { useHasSeenAnyTour } from "@/web/tour/tourStore";
import { tourDefaultAnchorClass } from "@/web/tour/tourUtils";

export const TourHelper = () => {
  const { sessionUser } = useSessionUser();
  const userCanEditTopicData = useUserCanEditTopicData(sessionUser?.username);

  const hasSeenAnyTour = useHasSeenAnyTour();
  const tourProps = useTour();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- hack to only update when values in tourProps change
  const memoTourProps = useMemo(() => tourProps, [JSON.stringify(tourProps)]);

  useEffect(() => {
    setReactTourProps(memoTourProps); // keep tour props up-to-date in a global variable for easy access

    if (!hasSeenAnyTour) startFirstTour(userCanEditTopicData);
  }, [hasSeenAnyTour, memoTourProps, userCanEditTopicData]);

  // Seems like there's no way to position the tour without an anchor, so here's one for when we
  // don't have a particular element we care to point out.
  return <div className={`${tourDefaultAnchorClass} invisible absolute -bottom-2 right-0`} />;
};