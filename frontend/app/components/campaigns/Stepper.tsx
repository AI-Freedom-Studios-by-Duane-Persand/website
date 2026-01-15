"use client";

import React from "react";
import { Button } from "../ui";

export interface StepperProps {
  step: number;
  setStep: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ step, setStep }) => {
  const steps = [
    { n: 1, label: "Create" },
    { n: 2, label: "Platforms" },
    { n: 3, label: "Strategize" },
    { n: 4, label: "Content" },
    { n: 5, label: "Review" },
    { n: 6, label: "Publish" },
  ];

  return (
    <div className="flex items-center space-x-4 mb-6">
      {steps.map((s) => (
        <Button
          key={s.n}
          onClick={() => setStep(s.n)}
          variant={step === s.n ? "primary" : "ghost"}
          size="sm"
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
};
