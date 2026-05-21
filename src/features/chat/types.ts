export interface MessageResponse {
  id: string
  relationshipId: string
  senderId: string
  senderName: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface MessagePageResponse {
  items: MessageResponse[]
  hasMore: boolean
  totalUnread: number
}
