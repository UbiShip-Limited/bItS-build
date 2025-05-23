import React from 'react';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex justify-between mb-8 px-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex flex-col items-center relative w-full">
          {/* Connection line */}
          {index < totalSteps - 1 && (
            <div className={`absolute top-4 left-[50%] w-full h-[2px] ${
              index < currentStep - 1 ? 'bg-[#C9A449]' : 'bg-[#444444]/20'
            }`}></div>
          )}
          
          <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 ${
            index + 1 === currentStep 
              ? 'bg-[#C9A449] text-white' 
              : index + 1 < currentStep 
                ? 'bg-[#C9A449] text-white' 
                : 'bg-[#444444]/20 text-[#444444]'
          }`}>
            {index + 1 < currentStep ? '✓' : index + 1}
          </div>
          <div className="text-xs text-[#444444] mt-2 font-medium">
            {index === 0 ? 'Initial Info' : index === 1 ? 'Design Details' : 'References'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressSteps;
