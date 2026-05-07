import type { ReactElement, ReactNode } from 'react'
import { BarChart3, ClipboardList, CreditCard, Shield, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/shared/components/Card'
import { Spinner } from '@/shared/components/Spinner'
import { useAdminDashboard } from '../index'
import { AdminHeader, formatMoney, MetricCard } from '../components/AdminPageParts'

export function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard()

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>
  if (!data) return null

  const metrics = [
    ['Total users', data.totalUsers],
    ['New users this month', data.newUsersThisMonth],
    ['Active coaches', data.activeCoaches],
    ['Active paid subscriptions', data.activePaidSubscriptions],
    ['Pending reports', data.pendingReports],
    ['Revenue this month', formatMoney(data.completedPaymentRevenueThisMonth)],
    ['Total plans created', data.totalPlansCreated],
    ['Completed workout days', data.completedWorkoutDays],
  ] as const

  return (
    <div className="space-y-6">
      <AdminHeader icon={<BarChart3 size={22} />} title="Admin Dashboard" subtitle="Website-wide operations and growth overview." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="User registrations" icon={<Users size={17} />}>
          <LineChart data={data.userRegistrations}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Revenue" icon={<CreditCard size={17} />}>
          <BarChart data={data.revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Subscription tiers" icon={<Shield size={17} />}>
          <BarChart data={data.subscriptionTierDistribution}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.subscriptionTierDistribution.map((_, index) => <Cell key={index} fill={index % 2 ? '#7a5b44' : '#556b3f'} />)}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Plan completion trend" icon={<ClipboardList size={17} />}>
          <LineChart data={data.planCompletionTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-1)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Line type="monotone" dataKey="value" stroke="#556b3f" strokeWidth={2} />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactElement }) {
  return (
    <Card animate={false} className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text">{icon}{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Card>
  )
}
