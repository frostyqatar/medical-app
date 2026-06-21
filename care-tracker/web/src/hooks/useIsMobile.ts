import { useState, useEffect } from 'react'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    let cancelled = false
    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipod/.test(ua)
    const isAndroid = /android/.test(ua) && /mobile/.test(ua)
    const isTouch = isIOS || isAndroid || window.innerWidth < 768

    if (!cancelled) setIsMobile(isTouch)

    function handleResize() {
      const touchNow = isIOS || isAndroid || window.innerWidth < 768
      if (!cancelled) setIsMobile(touchNow)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}
