"use client";

import { startTrainingTour } from "@/components/tour/TrainingTour";

// Header launcher for the guided training tour.
export default function StartTrainingButton() {
  return (
    <button
      type="button"
      onClick={startTrainingTour}
      className="rounded-md bg-[#1d3165] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#16264e]"
    >
      Training
    </button>
  );
}
