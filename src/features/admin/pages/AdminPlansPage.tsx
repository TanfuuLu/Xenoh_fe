import { useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import type { PlanType } from '@/shared/types/api'
import { useAdminPlans } from '../index'
import { AdminHeader, EmptyState, MetricCard } from '../components/AdminPageParts'

export function AdminPlansPage() {
  const [planType, setPlanType] = useState<PlanType | ''>('')
  const [ownerId, setOwnerId] = useState('')
  const [coachId, setCoachId] = useState('')
  const [isActive, setIsActive] = useState('')
  const { data: plans, isLoading } = useAdminPlans({ planType, ownerId, coachId, isActive })

  const totals = plans?.reduce(
    (acc, plan) => ({
      totalPlans: acc.totalPlans + 1,
      completedDays: acc.completedDays + plan.completedDays,
      totalExercises: acc.totalExercises + plan.totalExercises,
      totalVolume: acc.totalVolume + plan.totalVolume,
    }),
    { totalPlans: 0, completedDays: 0, totalExercises: 0, totalVolume: 0 },
  )

  return (
    <div className="space-y-6">
      <AdminHeader icon={<ClipboardList size={22} />} title="Plans" subtitle="Read-only plan usage and training analytics across the website." />

      <Card className="grid gap-3 lg:grid-cols-4">
        <Select label="Plan type" value={planType} placeholder="All types" onChange={(v) => setPlanType(v as PlanType | '')} options={['Self', 'Coach'].map((v) => ({ value: v, label: v }))} />
        <Input label="Owner ID" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder="Filter by owner" leftIcon={<Search size={15} />} />
        <Input label="Coach ID" value={coachId} onChange={(e) => setCoachId(e.target.value)} placeholder="Filter by coach" leftIcon={<Search size={15} />} />
        <Select label="Active" value={isActive} placeholder="All" onChange={setIsActive} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Plans" value={totals?.totalPlans ?? 0} />
        <MetricCard label="Completed days" value={totals?.completedDays ?? 0} />
        <MetricCard label="Exercises" value={totals?.totalExercises ?? 0} />
        <MetricCard label="Total volume" value={Math.round(totals?.totalVolume ?? 0)} />
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : !plans?.length ? (
        <EmptyState>No plans found.</EmptyState>
      ) : (
        <Card animate={false} className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_100px_110px_110px_100px] gap-3 border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted">
            <span>Plan</span><span>Owner</span><span>Coach</span><span>Type</span><span>Days</span><span>Completion</span><span>Status</span>
          </div>
          {plans.map((plan) => (
            <div key={plan.id} className="grid grid-cols-[1.3fr_1fr_1fr_100px_110px_110px_100px] gap-3 border-b border-border px-4 py-3 text-sm last:border-0">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-text">{plan.name}</span>
                <span className="block truncate text-xs text-muted">{plan.startDate} to {plan.endDate}</span>
              </span>
              <span className="min-w-0 truncate text-muted" title={plan.ownerEmail}>{plan.ownerName}</span>
              <span className="min-w-0 truncate text-muted" title={plan.coachEmail ?? undefined}>{plan.coachName ?? '-'}</span>
              <span className="text-muted">{plan.planType}</span>
              <span className="text-text">{plan.completedDays}/{plan.totalDays}</span>
              <span className="text-text">{plan.completionPercent}%</span>
              <span className="text-muted">{plan.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
