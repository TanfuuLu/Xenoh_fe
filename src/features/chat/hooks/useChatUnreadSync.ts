import { useEffect } from 'react'
import { useUnreadCounts } from '../api/useMessages'
import { useChatStore } from '../store/chatStore'

export function useChatUnreadSync() {
  const { data } = useUnreadCounts()
  const setUnreadCounts = useChatStore((s) => s.setUnreadCounts)

  useEffect(() => {
    if (data) setUnreadCounts(data)
  }, [data, setUnreadCounts])
}
