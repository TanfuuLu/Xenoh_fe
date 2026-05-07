import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Spinner } from '@/shared/components/Spinner'
import { useAdminPayments, useAdminPaymentSummary } from '../index'
import type { PaymentStatus, PlanTier } from '../types'
import { AdminHeader, EmptyState, formatDate, formatMoney, MetricCard } from '../components/AdminPageParts'

export function AdminPaymentsPage() {
  const [status, setStatus] = useState<PaymentStatus | ''>('')
  const [tier, setTier] = useState<PlanTier | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data: summary } = useAdminPaymentSummary()
  const { data: payments, isLoading } = useAdminPayments({ status, tier, from, to })

  return (
    <div className="space-y-6">
      <AdminHeader icon={<CreditCard size={22} />} title="Payments" subtitle="Read-only subscriptions, orders, and revenue analysis." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total revenue" value={formatMoney(summary?.totalRevenue ?? 0)} />
        <MetricCard label="Revenue this month" value={formatMoney(summary?.revenueThisMonth ?? 0)} />
        <MetricCard label="Pending amount" value={formatMoney(summary?.pendingAmount ?? 0)} />
        <MetricCard label="Completed orders" value={summary?.completedOrders ?? 0} />
        <MetricCard label="Active paid subscriptions" value={summary?.activePaidSubscriptions ?? 0} />
        <MetricCard label="ProIndividual" value={summary?.proIndividualSubscriptions ?? 0} />
        <MetricCard label="ProCoach" value={summary?.proCoachSubscriptions ?? 0} />
      </div>

      <Card className="grid gap-3 lg:grid-cols-4">
        <Select label="Status" value={status} placeholder="All statuses" onChange={(v) => setStatus(v as PaymentStatus | '')} options={['Pending', 'Completed', 'Failed', 'Expired'].map((v) => ({ value: v, label: v }))} />
        <Select label="Tier" value={tier} placeholder="All tiers" onChange={(v) => setTier(v as PlanTier | '')} options={['ProIndividual', 'ProCoach'].map((v) => ({ value: v, label: v }))} />
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </Card>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Spinner /></div>
      ) : !payments?.length ? (
        <EmptyState>No payment orders found.</EmptyState>
      ) : (
        <Card animate={false} className="overflow-hidden p-0">
          <div className="grid grid-cols-[1.1fr_120px_120px_100px_1fr_110px_110px] gap-3 border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted">
            <span>User</span><span>Tier</span><span>Amount</span><span>Status</span><span>Transfer</span><span>Created</span><span>Paid</span>
          </div>
          {payments.map((payment) => (
            <div key={payment.id} className="grid grid-cols-[1.1fr_120px_120px_100px_1fr_110px_110px] gap-3 border-b border-border px-4 py-3 text-sm last:border-0">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-text">{payment.userName}</span>
                <span className="block truncate text-xs text-muted">{payment.userEmail}</span>
              </span>
              <span className="text-muted">{payment.requestedTier}</span>
              <span className="font-medium text-text">{formatMoney(payment.amount)}</span>
              <span className="text-muted">{payment.status}</span>
              <span className="min-w-0 truncate text-muted" title={payment.sePayReferenceCode ?? payment.transferCode}>{payment.transferCode}</span>
              <span className="text-muted">{formatDate(payment.createdAt)}</span>
              <span className="text-muted">{formatDate(payment.paidAt)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
