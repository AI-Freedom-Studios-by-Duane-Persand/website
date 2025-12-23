import React from "react";

const Stepper = ({ step, setStep }) => {
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
        <button
          key={s.n}
          onClick={() => setStep(s.n)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            step === s.n
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default Stepper;