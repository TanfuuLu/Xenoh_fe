import { Link, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { useClientCycleOverview } from '../api/useCycle'
import { ClientCycleSummaryCard } from '../components/ClientCycleSummaryCard'

export function ClientCyclePage() {
  const t = useT()
  const tc = t.cycle
  const { clientId = '' } = useParams()
  const { data, isLoading, isError } = useClientCycleOverview(clientId)

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5">
      <div className="flex items-center gap-2">
        <Link to={`/coach/clients/${clientId}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-text">{tc.coach.title}</h1>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : isError || !data ? (
        <Card className="py-10 text-center">
          <p className="text-sm text-muted">{tc.coach.notShared}</p>
        </Card>
      ) : (
        <ClientCycleSummaryCard overview={data} />
      )}
    </div>
  )
}
