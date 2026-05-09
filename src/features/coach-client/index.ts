export {
  useRequestCoach,
  useAcceptRequest,
  useTerminateRelationship,
  useRequestTermination,
  useAcceptTermination,
  useRejectTermination,
  useRequestRenewal,
  useAcceptRenewal,
  useRejectRenewal,
  usePendingRequests,
  useMyCoach,
  useMyClients,
  useCoachDashboard,
} from './api/useCoachClient'
export type {
  CoachRelationshipResponse,
  ClientResponse,
  RequestCoachRequest,
  RequestRenewalRequest,
  CoachClientDashboardResponse,
  BigThreePRs,
} from './types'
