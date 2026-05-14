import { useEffect, useRef } from 'react'

export function useMidnightRefresh(callback: () => void): void {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>

    function schedule() {
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
      timerId = setTimeout(() => {
        callbackRef.current()
        schedule()
      }, midnight.getTime() - now.getTime())
    }

    schedule()
    return () => clearTimeout(timerId)
  }, [])
}
