import { useState } from 'react'
import { Search, UserCheck, UserX, Users } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import type { UserRole } from '@/shared/types/api'
import { useAdminSuspendUser, useAdminUnsuspendUser, useAdminUser, useAdminUsers } from '../index'
import type { PlanTier } from '../types'
import { AdminHeader, EmptyState, formatDate } from '../components/AdminPageParts'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [tier, setTier] = useState<PlanTier | ''>('')
  const [suspended, setSuspended] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>()
  const { data: users, isLoading } = useAdminUsers({ search, role, tier, suspended })
  const { data: detail } = useAdminUser(selectedUserId)
  const suspendUser = useAdminSuspendUser()
  const unsuspendUser = useAdminUnsuspendUser()

  const selected = detail ?? users?.find((u) => u.id === selectedUserId)

  return (
    <div className="space-y-6">
      <AdminHeader icon={<Users size={22} />} title="Users" subtitle="Analyze accounts, roles, subscriptions, and moderation status." />

      <Card className="grid gap-3 lg:grid-cols-4">
        <Input label="Search" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search size={15} />} />
        <Select label="Role" value={role} placeholder="All roles" onChange={(v) => setRole(v as UserRole | '')} options={['Individual', 'Coach', 'Admin'].map((v) => ({ value: v, label: v }))} />
        <Select label="Subscription" value={tier} placeholder="All tiers" onChange={(v) => setTier(v as PlanTier | '')} options={['Free', 'ProIndividual', 'ProCoach'].map((v) => ({ value: v, label: v }))} />
        <Select label="Status" value={suspended} placeholder="All users" onChange={setSuspended} options={[{ value: 'false', label: 'Active' }, { value: 'true', label: 'Suspended' }]} />
      </Card>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : !users?.length ? (
        <EmptyState>No users found.</EmptyState>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card animate={false} className="overflow-hidden p-0">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_120px_120px] gap-3 border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted">
              <span>User</span><span>Roles</span><span>Subscription</span><span>Plans</span><span>Status</span>
            </div>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className="grid w-full grid-cols-[1.4fr_1fr_1fr_120px_120px] gap-3 border-b border-border px-4 py-3 text-left text-sm last:border-0 hover:bg-panel"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-text">{user.fullName}</span>
                  <span className="block truncate text-xs text-muted">{user.email}</span>
                </span>
                <span className="truncate text-muted">{user.roles.join(', ') || '-'}</span>
                <span className="truncate text-muted">{user.subscriptionTier}</span>
                <span className="text-text">{user.planCount}</span>
                <span className={user.isSuspended ? 'text-danger' : 'text-muted'}>{user.isSuspended ? 'Suspended' : 'Active'}</span>
              </button>
            ))}
          </Card>

          <Card animate={false} className="space-y-4">
            {selected ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-text">{selected.fullName}</h2>
                  <p className="text-sm text-muted">{selected.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Plans" value={selected.planCount} />
                  <MiniStat label="Workouts" value={selected.workoutHistoryCount} />
                  <MiniStat label="Reports made" value={selected.reportsMadeCount} />
                  <MiniStat label="Reports received" value={selected.reportsReceivedCount} />
                </div>
                {detail && detail.id === selected.id && (
                  <div className="space-y-2 text-sm">
                    <Info label="Created" value={formatDate(detail.createdAt)} />
                    <Info label="Tier" value={`${detail.subscriptionTier}${detail.isSubscriptionActive ? '' : ' (inactive)'}`} />
                    <Info label="Height" value={detail.height ? `${detail.height} cm` : '-'} />
                    <Info label="Gender" value={detail.gender ?? '-'} />
                    <Info label="Date of birth" value={detail.dateOfBirth ?? '-'} />
                    <Info label="Coach" value={detail.coachRelationship ? detail.coachRelationship.userName : '-'} />
                    <Info label="Clients" value={String(detail.clientRelationships.length)} />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" loading={suspendUser.isPending} onClick={() => suspendUser.mutate(selected.id)}>
                    <UserX size={15} /> Suspend
                  </Button>
                  <Button variant="secondary" size="sm" loading={unsuspendUser.isPending} onClick={() => unsuspendUser.mutate(selected.id)}>
                    <UserCheck size={15} /> Unsuspend
                  </Button>
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted">Select a user to view details.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-text">{value}</span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-xs uppercase text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-text">{value}</p>
    </div>
  )
}
