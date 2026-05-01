import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ArrowRight, Check, Dumbbell, Users } from 'lucide-react'
import { useAuthStore, useCompleteExternalRegistration } from '../index'
import type { CompleteExternalRegistrationRequest } from '../types'

const roles: Array<{
  id: CompleteExternalRegistrationRequest['role']
  title: string
  subtitle: string
  detail: string
  icon: typeof Dumbbell
  accent: string
  surface: string
  border: string
}> = [
  {
    id: 'Individual',
    title: 'Train as an individual',
    subtitle: 'Log workouts, follow plans, and build a record you can trust.',
    detail: 'Best for lifters tracking their own training or working with a coach.',
    icon: Dumbbell,
    accent: 'var(--xn-clay-700)',
    surface: 'linear-gradient(145deg, #fff7ea 0%, var(--xn-clay-200) 100%)',
    border: 'var(--xn-clay-500)',
  },
  {
    id: 'Coach',
    title: 'Join as a coach',
    subtitle: 'Manage clients, assign plans, and review progress in one place.',
    detail: 'Best for coaches building programs and keeping athletes accountable.',
    icon: Users,
    accent: 'var(--xn-sage-700)',
    surface: 'linear-gradient(145deg, var(--xn-sage-100) 0%, var(--xn-sage-200) 58%, var(--xn-clay-100) 100%)',
    border: 'var(--xn-sage-500)',
  },
]

export function ChooseRolePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [role, setRole] = useState<CompleteExternalRegistrationRequest['role']>('Individual')
  const { mutate: completeRegistration, isPending, error } = useCompleteExternalRegistration()

  if (!user) return <Navigate to="/login" replace />
  if (user.roles.length > 0) return <Navigate to="/dashboard" replace />

  const selectedRole = roles.find((item) => item.id === role) ?? roles[0]
  const SelectedIcon = selectedRole.icon

  return (
    <main
      className="min-h-screen px-5 py-8 md:px-10"
      style={{
        background: [
          'radial-gradient(circle at 14% 10%, rgba(216, 189, 167, 0.62), transparent 30%)',
          'radial-gradient(circle at 86% 16%, rgba(203, 208, 170, 0.5), transparent 28%)',
          'linear-gradient(180deg, var(--xn-paper) 0%, var(--xn-clay-100) 100%)',
        ].join(', '),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/grain.svg)',
          backgroundSize: '340px',
          opacity: 0.075,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 'max(-120px, -10vw)',
          bottom: '-160px',
          width: 420,
          height: 420,
          borderRadius: '50%',
          border: '1px solid rgba(135, 111, 94, 0.22)',
        }}
      />

      <section
        style={{
          position: 'relative',
          width: 'min(100%, 1040px)',
          margin: '0 auto',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%' }}>
          <div className="mb-8 flex items-center justify-between gap-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/assets/logo-mark.svg" alt="Xenoh" width={34} height={34} />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 23,
                  fontWeight: 700,
                  color: 'var(--fg-1)',
                  letterSpacing: '-0.01em',
                }}
              >
                Xenoh
              </span>
            </div>
            <span
              className="hidden rounded-full px-4 py-2 text-xs font-semibold md:inline-flex"
              style={{
                color: 'var(--xn-clay-900)',
                background: 'rgba(255, 250, 243, 0.72)',
                border: '1px solid var(--xn-clay-300)',
                boxShadow: 'var(--sh-xs)',
              }}
            >
              Social account connected
            </span>
          </div>

          <div
            style={{
              border: '1px solid var(--xn-clay-300)',
              borderRadius: 30,
              background: 'color-mix(in oklch, var(--bg-2) 76%, transparent)',
              boxShadow: 'var(--sh-xl)',
              overflow: 'hidden',
              backdropFilter: 'blur(18px)',
            }}
          >
            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <aside
                style={{
                  padding: 'clamp(28px, 5vw, 54px)',
                  background: 'linear-gradient(145deg, var(--xn-clay-200) 0%, var(--xn-clay-100) 52%, var(--bg-2) 100%)',
                  borderRight: '1px solid var(--xn-clay-300)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--xn-clay-800)',
                    marginBottom: 18,
                  }}
                >
                  Finish your setup
                </div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 'clamp(42px, 7vw, 72px)',
                    lineHeight: 0.98,
                    letterSpacing: '-0.035em',
                    color: 'var(--xn-ink-900)',
                    margin: '0 0 24px',
                    textWrap: 'balance',
                  }}
                >
                  Choose your training side.
                </h1>
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.7,
                    color: 'var(--xn-ink-700)',
                    maxWidth: 390,
                    margin: '0 0 34px',
                  }}
                >
                  Your social account is connected. Pick the role that matches how you will use Xenoh today.
                </p>

                <div
                  style={{
                    borderRadius: 20,
                    background: 'rgba(255, 250, 243, 0.62)',
                    border: '1px solid rgba(193, 170, 149, 0.72)',
                    padding: 18,
                    boxShadow: 'var(--sh-xs)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: selectedRole.accent,
                        color: 'white',
                      }}
                    >
                      <SelectedIcon size={18} />
                    </span>
                    <strong style={{ color: 'var(--fg-1)', fontSize: 15 }}>{selectedRole.id}</strong>
                  </div>
                  <p style={{ margin: 0, color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.6 }}>
                    You can keep building your profile after this step. We just need the right starting dashboard.
                  </p>
                </div>
              </aside>

              <div style={{ padding: 'clamp(22px, 4vw, 42px)' }}>
                <div className="grid gap-4 md:grid-cols-2">
                  {roles.map((item) => {
                    const selected = role === item.id
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRole(item.id)}
                        aria-pressed={selected}
                        style={{
                          textAlign: 'left',
                          border: selected ? `2px solid ${item.accent}` : '1px solid var(--border-1)',
                          borderRadius: 24,
                          padding: 24,
                          minHeight: 280,
                          background: item.surface,
                          cursor: 'pointer',
                          boxShadow: selected ? 'var(--sh-lg)' : 'var(--sh-sm)',
                          position: 'relative',
                          overflow: 'hidden',
                          transform: selected ? 'translateY(-3px)' : 'translateY(0)',
                          transition: 'all var(--dur-med) var(--ease-out)',
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            right: -34,
                            bottom: -42,
                            fontFamily: 'var(--font-display)',
                            fontSize: 150,
                            fontWeight: 800,
                            lineHeight: 1,
                            color: 'rgba(88, 63, 46, 0.055)',
                          }}
                        >
                          {item.id === 'Individual' ? '01' : '02'}
                        </span>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
                            <span
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: selected ? item.accent : 'rgba(255, 250, 243, 0.68)',
                                color: selected ? 'white' : item.accent,
                                border: selected ? 'none' : `1px solid ${item.border}`,
                                boxShadow: 'var(--sh-xs)',
                              }}
                            >
                              <Icon size={22} />
                            </span>

                            <span
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: selected ? item.accent : 'rgba(255, 250, 243, 0.48)',
                                color: selected ? 'white' : 'transparent',
                                border: selected ? 'none' : '1px solid rgba(143, 115, 94, 0.36)',
                              }}
                            >
                              <Check size={16} strokeWidth={3} />
                            </span>
                          </div>

                          <p
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 28,
                              lineHeight: 1.04,
                              fontWeight: 700,
                              color: 'var(--fg-1)',
                              margin: '0 0 14px',
                              letterSpacing: '-0.015em',
                            }}
                          >
                            {item.title}
                          </p>
                          <p style={{ color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 18px', fontSize: 15 }}>
                            {item.subtitle}
                          </p>
                          <p
                            style={{
                              color: 'var(--fg-3)',
                              lineHeight: 1.55,
                              margin: 0,
                              fontSize: 13,
                              borderTop: '1px dashed rgba(143, 115, 94, 0.36)',
                              paddingTop: 16,
                            }}
                          >
                            {item.detail}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {error && (
                  <p className="mt-5 rounded-xl px-4 py-3 text-sm" style={{ color: 'var(--xn-danger)', background: 'var(--xn-danger-bg)' }}>
                    Could not complete registration. Please try again.
                  </p>
                )}

                <div
                  className="mt-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{
                    borderColor: 'var(--border-1)',
                    background: 'rgba(255, 250, 243, 0.68)',
                  }}
                >
                  <p style={{ margin: 0, color: 'var(--fg-3)', fontSize: 13 }}>
                    Selected: <strong style={{ color: 'var(--fg-1)' }}>{selectedRole.id}</strong>
                  </p>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => completeRegistration({ role }, { onSuccess: () => navigate('/dashboard', { replace: true }) })}
                    style={{
                      border: 'none',
                      borderRadius: 999,
                      padding: '12px 22px',
                      background: 'var(--xn-clay-700)',
                      color: 'var(--fg-on-clay)',
                      boxShadow: 'var(--sh-sm), var(--sh-inset)',
                      fontWeight: 700,
                      cursor: isPending ? 'not-allowed' : 'pointer',
                      opacity: isPending ? 0.7 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 9,
                    }}
                  >
                    {isPending ? 'Saving...' : 'Continue'}
                    {!isPending && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
