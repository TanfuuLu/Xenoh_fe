export interface NotificationResponse {
  id: string
  type: string
  message: string
  isRead: boolean
  relatedEntityId: string | null
  relatedEntityType: string | null
  createdAt: string
}
