
import { useEffect, useState } from "react";

/**
 * A custom hook to detect if the viewport is mobile-sized
 * @param breakpoint The width threshold for mobile detection in pixels (default: 768)
 * @returns boolean indicating if the viewport is mobile-sized
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener
    window.addEventListener("resize", checkMobile);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);
  
  return isMobile;
}
