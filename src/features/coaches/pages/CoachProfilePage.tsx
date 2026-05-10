import { useParams } from 'react-router'
import { CoachProfileContent } from '../components/CoachProfileContent'

export function CoachProfilePage() {
  const { coachId = '' } = useParams()

  return <CoachProfileContent coachId={coachId} showBack />
}
