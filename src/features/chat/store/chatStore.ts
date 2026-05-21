import { create } from 'zustand'

interface ChatState {
  unreadCounts: Record<string, number>
  setUnreadCounts: (counts: Record<string, number>) => void
  incrementUnread: (relationshipId: string) => void
  clearUnread: (relationshipId: string) => void
}

export const useChatStore = create<ChatState>()((set) => ({
  unreadCounts: {},

  setUnreadCounts: (counts) => set({ unreadCounts: counts }),

  incrementUnread: (relationshipId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [relationshipId]: (state.unreadCounts[relationshipId] ?? 0) + 1,
      },
    })),

  clearUnread: (relationshipId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [relationshipId]: 0 },
    })),
}))
