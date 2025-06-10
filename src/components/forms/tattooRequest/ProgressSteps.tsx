import React from 'react';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, totalSteps }) => {
  const stepLabels = ['Initial Info', 'Design Details', 'References'];
  
  return (
    <div className="flex justify-between mb-8 px-2 sm:px-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex flex-col items-center relative w-full">
          {/* Connection line */}
          {index < totalSteps - 1 && (
            <div className={`absolute top-4 left-[50%] w-full h-[1px] transition-all duration-500 ${
              index < currentStep - 1 
                ? 'bg-gradient-to-r from-[#C9A449] to-[#C9A449]/80' 
                : 'bg-gradient-to-r from-white/20 to-white/10'
            }`}></div>
          )}
          
          {/* Step circle */}
          <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-2 font-body text-sm font-medium ${
            index + 1 === currentStep 
              ? 'bg-[#C9A449] text-white border-[#C9A449] shadow-lg shadow-[#C9A449]/30' 
              : index + 1 < currentStep 
                ? 'bg-[#C9A449] text-white border-[#C9A449] shadow-md' 
                : 'bg-[#080808] text-white/60 border-white/30 hover:border-white/50'
          }`}>
            {index + 1 < currentStep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          
          {/* Step label */}
          <div className={`text-xs mt-3 font-body text-center transition-all duration-300 ${
            index + 1 === currentStep 
              ? 'text-[#C9A449] font-medium' 
              : index + 1 < currentStep 
                ? 'text-white/80 font-medium' 
                : 'text-white/50'
          }`}>
            <span className="hidden sm:inline">{stepLabels[index]}</span>
            <span className="sm:hidden">Step {index + 1}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressSteps;
