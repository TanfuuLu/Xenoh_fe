import { useNavigate } from 'react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { CheckCircle2, XCircle, User } from 'lucide-react'
import { format } from 'date-fns'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import {
  usePendingRequests,
  useMyClients,
  useAcceptRequest,
  useTerminateRelationship,
} from '../index'

export function ClientsPage() {
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const { data: pending, isLoading: pendingLoading } = usePendingRequests()
  const { data: clients, isLoading: clientsLoading } = useMyClients()
  const { mutate: accept, isPending: accepting } = useAcceptRequest()
  const { mutate: terminate, isPending: terminating } = useTerminateRelationship()
  const t   = useT()
  const tcl = t.clients

  if (pendingLoading || clientsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const activeClients = clients?.filter((c) => c.status === 'Active') ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">{tcl.title}</h1>

      {/* Pending requests */}
      {(pending?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {tcl.pendingHeader} ({pending?.length})
          </h2>
          <motion.div
            initial={shouldReduce ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
            className="space-y-2"
          >
            <AnimatePresence>
              {pending?.map((req) => (
                <motion.div
                  key={req.id}
                  variants={slideUp}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                  style={{ borderColor: 'var(--xn-warning)', background: 'var(--xn-warning-bg)' }}
                >
                  <div>
                    <p className="font-medium text-text">{req.clientName}</p>
                    <p className="text-xs text-muted">
                      {format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={accepting}
                      onClick={() => accept(req.id)}
                    >
                      <CheckCircle2 size={14} /> {tcl.accept}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={terminating}
                      onClick={() => terminate(req.id)}
                    >
                      <XCircle size={14} /> {tcl.decline}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {/* Active clients */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {tcl.activeHeader} ({activeClients.length})
        </h2>
        <motion.div
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={staggerContainer}
          className="space-y-2"
        >
          {activeClients.map((client) => (
            <motion.div
              key={client.relationshipId}
              variants={slideUp}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/coach/clients/${client.clientId}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/coach/clients/${client.clientId}`)
                }
              }}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <div>
                <p className="font-medium text-text">{client.fullName}</p>
                <p className="text-sm text-muted">{client.email}</p>
                <p className="text-xs text-muted">
                  {tcl.connectedSince} {format(new Date(client.connectedAt), 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">
                  Last workout:{' '}
                  {client.lastWorkoutCompletedAt
                    ? format(new Date(client.lastWorkoutCompletedAt), 'dd/MM/yyyy')
                    : '-'}
                </span>
                <Badge variant="success">Active</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    navigate(`/coach/clients/${client.clientId}`)
                  }}
                >
                  <User size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={terminating}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (confirm(tcl.disconnectConfirm.replace('{name}', client.fullName))) {
                      terminate(client.relationshipId)
                    }
                  }}
                >
                  <XCircle size={14} className="text-danger" />
                </Button>
              </div>
            </motion.div>
          ))}
          {activeClients.length === 0 && (
            <Card className="py-8 text-center text-muted">{tcl.noActive}</Card>
          )}
        </motion.div>
      </section>
    </div>
  )
}
