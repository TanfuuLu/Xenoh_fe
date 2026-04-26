import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, UserPlus, CheckCircle2, User } from 'lucide-react'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Spinner } from '@/shared/components/Spinner'
import { staggerContainer, slideUp } from '@/shared/utils/motion'
import { useT } from '@/shared/i18n'
import { useCoaches } from '../index'
import { useMyCoach, useRequestCoach, useTerminateRelationship } from '@/features/coach-client'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/shared/types/api'

export function CoachesPage() {
  const shouldReduce = useReducedMotion()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const t   = useT()
  const tco = t.coaches
  const tcp = t.coachProfile

  const { data: coaches, isLoading } = useCoaches({ name: debouncedSearch || undefined })
  const { data: myCoach } = useMyCoach()
  const { mutate: requestCoach, isPending: requesting, error: reqError } = useRequestCoach()
  const { mutate: terminate, isPending: terminating } = useTerminateRelationship()

  const apiError = (reqError as AxiosError<ApiError>)?.response?.data?.message

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{tco.title}</h1>
        <p className="mt-1 text-sm text-muted">{tco.subtitle}</p>
      </div>

      {/* Current coach */}
      {myCoach && (
        <Card className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{tco.currentCoach}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text">{myCoach.coachName}</p>
              <Badge variant={myCoach.status === 'Active' ? 'success' : 'warning'}>
                {myCoach.status === 'Active' ? tco.connected : tco.pending}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {myCoach.status === 'Active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/coaches/${myCoach.coachId}`)}
                >
                  <User size={15} /> {tcp.viewProfile}
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                loading={terminating}
                onClick={() => {
                  if (confirm(tco.disconnectConfirm)) {
                    terminate(myCoach.id)
                  }
                }}
              >
                {tco.disconnect}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Input
        placeholder={tco.searchPlaceholder}
        leftIcon={<Search size={16} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {apiError && <p className="text-sm text-danger">{apiError}</p>}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <motion.div
          initial={shouldReduce ? false : 'hidden'}
          animate="visible"
          variants={staggerContainer}
          className="space-y-3"
        >
          <AnimatePresence>
            {coaches?.map((coach) => {
              const isMyCoach = myCoach?.coachId === coach.id
              return (
                <motion.div
                  key={coach.id}
                  variants={slideUp}
                  layout
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-text">{coach.fullName}</p>
                    <p className="text-sm text-muted">{coach.email}</p>
                  </div>
                  {isMyCoach ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/coaches/${coach.id}`)}
                      >
                        <User size={15} /> {tcp.viewProfile}
                      </Button>
                      <CheckCircle2 size={20} className="text-success" />
                    </div>
                  ) : myCoach ? (
                    <span className="text-xs text-muted">{tco.alreadyHasCoach}</span>
                  ) : (
                    <Button
                      size="sm"
                      loading={requesting}
                      onClick={() => requestCoach({ coachId: coach.id })}
                    >
                      <UserPlus size={15} /> {tco.connectBtn}
                    </Button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          {coaches?.length === 0 && (
            <p className="text-center text-muted py-8">{tco.noResults}</p>
          )}
        </motion.div>
      )}
    </div>
  )
}
