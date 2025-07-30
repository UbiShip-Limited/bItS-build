import React from 'react';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, totalSteps }) => {
  const stepLabels = ['Initial Info', 'Design Details', 'References'];
  
  return (
    <div className="flex justify-between mb-10 px-4 sm:px-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex flex-col items-center relative w-full">
          {/* Connection line */}
          {index < totalSteps - 1 && (
            <div className={`absolute top-5 left-[50%] w-full h-[2px] transition-all duration-700 ease-out ${
              index < currentStep - 1 
                ? 'bg-gradient-to-r from-[#C9A449] via-[#C9A449]/90 to-[#C9A449]/80' 
                : 'bg-gradient-to-r from-white/10 via-white/20 to-white/10'
            }`}>
              {index < currentStep - 1 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              )}
            </div>
          )}
          
          {/* Step circle */}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center z-10 transition-all duration-700 ease-out border-2 font-body text-sm font-medium transform ${
            index + 1 === currentStep 
              ? 'bg-[#C9A449] text-white border-[#C9A449] shadow-[0_0_20px_rgba(201,164,73,0.4)] scale-110' 
              : index + 1 < currentStep 
                ? 'bg-[#C9A449]/90 text-white border-[#C9A449] shadow-[0_4px_12px_rgba(201,164,73,0.2)]' 
                : 'bg-[#080808]/50 text-white/50 border-white/20 hover:border-white/40 hover:bg-[#080808]/70'
          }`}>
            {index + 1 < currentStep ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          
          {/* Step label */}
          <div className={`text-xs mt-3 font-body text-center transition-all duration-500 transform ${
            index + 1 === currentStep 
              ? 'text-[#C9A449] font-semibold scale-105' 
              : index + 1 < currentStep 
                ? 'text-white/70 font-medium' 
                : 'text-white/40'
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
