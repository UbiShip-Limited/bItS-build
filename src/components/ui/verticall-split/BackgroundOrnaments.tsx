import Image from "next/image";

export function BackgroundOrnaments() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute top-1/4 left-1/6 w-32 h-32 opacity-[0.02]">
        <Image 
          src="/images/bowen-logo.svg" 
          alt="Background Logo" 
          fill
          sizes="128px"
          className="object-contain brightness-0 invert"
        />
      </div>
      <div className="absolute top-3/4 right-1/6 w-24 h-24 opacity-[0.02] rotate-45">
        <Image 
          src="/images/bowen-logo.svg" 
          alt="Background Logo" 
          fill
          sizes="96px"
          className="object-contain brightness-0 invert"
        />
      </div>
      <div className="absolute top-1/2 left-1/2 w-16 h-16 opacity-[0.01] -translate-x-1/2 -translate-y-1/2">
        <Image 
          src="/images/bowen-logo.svg" 
          alt="Background Logo" 
          fill
          sizes="64px"
          className="object-contain brightness-0 invert"
        />
      </div>
    </div>
  );
} 