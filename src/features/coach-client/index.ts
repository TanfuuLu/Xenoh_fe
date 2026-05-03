export {
  useRequestCoach,
  useAcceptRequest,
  useTerminateRelationship,
  useRequestTermination,
  useAcceptTermination,
  useRejectTermination,
  usePendingRequests,
  useMyCoach,
  useMyClients,
  useCoachDashboard,
} from './api/useCoachClient'
export type {
  CoachRelationshipResponse,
  ClientResponse,
  RequestCoachRequest,
  CoachClientDashboardResponse,
  BigThreePRs,
} from './types'
