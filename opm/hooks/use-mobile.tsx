"use client"

import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768 // Corresponds to md: breakpoint in Tailwind CSS

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on initial mount
    checkDevice()

    // Add resize listener
    window.addEventListener("resize", checkDevice)

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("resize", checkDevice)
    }
  }, [breakpoint])

  return isMobile
}
