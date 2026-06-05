import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useT } from '@/shared/i18n'
import { RequireTier } from '@/features/billing/components/RequireTier'
import { useNutritionSummary } from '../api/useNutrition'
import { NutritionInsightPanel } from '../components/NutritionPanels'
import { toField, type LogForm } from '../components/nutritionHelpers'

export function NutritionInsightPage() {
  const t = useT()
  const tn = t.nutrition
  const { clientId } = useParams()
  const isClientView = Boolean(clientId)
  const { data: summary, isLoading } = useNutritionSummary(clientId)
  const [logForm, setLogForm] = useState<LogForm>({
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    notes: '',
  })

  useEffect(() => {
    if (!summary) return
    setLogForm({
      calories: toField(summary.todayLog?.calories),
      proteinG: toField(summary.todayLog?.proteinG),
      carbsG: toField(summary.todayLog?.carbsG),
      fatG: toField(summary.todayLog?.fatG),
      notes: summary.todayLog?.notes ?? '',
    })
  }, [summary])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!summary) return <p className="text-muted">{tn.notAvailable}</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link to={isClientView ? `/coach/clients/${clientId}/nutrition` : '/nutrition'} className="mb-2 inline-flex">
            <Button variant="ghost" size="sm">
              <ChevronLeft size={16} /> {isClientView ? tn.clientTitle : tn.title}
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles size={22} style={{ color: 'var(--xn-clay-700)' }} />
            <h1 className="break-words text-2xl font-bold text-text">{tn.nutritionInsightTitle}</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted">{tn.nutritionInsightSubtitle}</p>
        </div>
      </div>

      {!summary.canUseAdvancedAnalysis && (
        <Card className="py-4">
          <p className="text-sm text-muted">{tn.advancedNoLogs}</p>
        </Card>
      )}

      <RequireTier feature={tn.nutritionInsight}>
        <NutritionInsightPanel
          clientId={clientId}
          enabled={summary.canUseAdvancedAnalysis}
          summary={summary}
          logForm={logForm}
        />
      </RequireTier>
    </div>
  )
}
