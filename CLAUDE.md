# CLAUDE.md — Xenoh Frontend

Đây là file duy nhất Claude cần đọc để hiểu toàn bộ project và bắt đầu làm việc ngay.

---

## 1. Project là gì

**Xenoh** là ứng dụng fitness/workout coaching:
- **Individual** tự tạo kế hoạch tập, log bài tập, theo dõi cân nặng, streak, BMI, DOTS score.
- **Coach** tạo kế hoạch cho client, theo dõi tiến độ client.
- Individual có thể request kết nối với Coach; Coach accept/reject.

---

## 2. Tech stack (bắt buộc dùng đúng version)

| Thư viện | Version | Dùng cho |
|----------|---------|---------|
| React | `^19` | UI framework |
| TypeScript | `^5.7` | Language (`strict: true`) |
| Vite | `^6` | Build tool |
| Tailwind CSS | `^4` | Styling — dark mode first |
| Framer Motion | `^12` | Animation |
| TanStack Query | `^5` | Server state (mọi dữ liệu từ API) |
| Zustand `+ persist` | `^5` | Client/UI state (auth token, sidebar...) |
| React Router | `^7` | Routing — lazy load mọi page |
| Axios | `^1.7` | HTTP client — dùng instance `api` từ `src/shared/api/axios.ts` |
| React Hook Form | `^7` | Form |
| Zod | `^3` | Validation schema |
| Lucide React | latest | Icons |
| Recharts | `^2` | Charts (bodyweight, progress) |
| date-fns | `^4` | Xử lý ngày tháng |
| clsx + tailwind-merge | latest | `cn()` utility |

---

## 3. Cấu trúc thư mục

```
src/
├── app/
│   ├── main.tsx
│   ├── App.tsx
│   ├── Router.tsx          ← lazy-load tất cả pages ở đây
│   └── QueryProvider.tsx
│
├── shared/
│   ├── types/
│   │   └── api.ts          ← ApiError, UserRole, Gender, PlanType, MuscleGroup
│   ├── api/
│   │   ├── axios.ts        ← instance axios + JWT interceptor + refresh retry
│   │   └── endpoints.ts    ← MỌI URL đặt ở đây, không hardcode trong component
│   ├── components/         ← Button, Input, Modal, Card, Spinner, Badge...
│   ├── hooks/              ← useDebounce, useMediaQuery...
│   ├── layouts/
│   │   ├── AppLayout.tsx   ← sidebar + header, dành cho authenticated routes
│   │   └── AuthLayout.tsx  ← centered card, dành cho login/register
│   └── utils/
│       ├── cn.ts           ← twMerge + clsx
│       └── motion.ts       ← preset animation: fadeIn, slideUp, scaleIn, staggerContainer
│
└── features/               ← KHÔNG import chéo giữa features
    ├── auth/
    │   ├── types.ts
    │   ├── api/useAuth.ts
    │   └── store/authStore.ts
    ├── profile/
    │   ├── types.ts
    │   └── api/useProfile.ts
    ├── coaches/
    │   ├── types.ts
    │   └── api/useCoaches.ts
    ├── coach-client/
    │   ├── types.ts
    │   └── api/useCoachClient.ts
    ├── plans/
    │   ├── types.ts
    │   └── api/usePlans.ts
    └── workouts/
        ├── types.ts
        └── api/
            ├── useWeeklyWorkouts.ts
            ├── useDailyWorkouts.ts
            ├── useExercises.ts
            └── useExerciseTemplates.ts
```

> Tất cả types + hooks phía trên **đã được tạo sẵn** trong `src/`. Không tạo lại, chỉ import và dùng.

---

## 4. Types đã có sẵn

### `src/shared/types/api.ts`
```ts
type UserRole = 'Individual' | 'Coach' | 'Admin'
type Gender = 'Male' | 'Female'
type RelationshipStatus = 'Pending' | 'Active'
type PlanType = 'Self' | 'Coach'
const MuscleGroup = { Chest, Back, Shoulders, Biceps, Triceps, Forearms,
                      Quadriceps, Hamstrings, Glutes, Calves, Core, FullBody }
type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup]
interface ApiError { message: string }
```

### `src/features/auth/types.ts`
```ts
interface AuthResponse { accessToken, refreshToken, email, fullName, roles }
interface RegisterRequest { email, password, firstName, lastName, role }
interface LoginRequest { email, password }
```

### `src/features/profile/types.ts`
```ts
interface UserProfileResponse {
  id, email, firstName, lastName,
  height: number|null, gender: Gender|null, dateOfBirth: string|null,
  currentStreak: number, latestBodyweight: number|null,
  bmi: number|null, bmiCategory: string|null, dotsScore: number|null
}
interface UpdateProfileRequest { height?, gender?, dateOfBirth? }
interface BodyweightLogResponse { id, weight: number, date: string }
interface LogBodyweightRequest { weight: number }
```

### `src/features/coaches/types.ts`
```ts
interface CoachResponse { id, fullName, email }
```

### `src/features/coach-client/types.ts`
```ts
interface CoachRelationshipResponse {
  id, clientId, clientName, coachId, coachName,
  status: RelationshipStatus, createdAt
}
interface ClientResponse { relationshipId, clientId, fullName, email, status, connectedAt }
interface RequestCoachRequest { coachId: string }
```

### `src/features/plans/types.ts`
```ts
interface PlanResponse {
  id, name, startDate, endDate, planType: PlanType,
  ownerId, ownerName, createdByCoachId: string|null, coachName: string|null,
  totalWeeks, totalDays, completedDays, isActive: boolean, createdAt
}
interface CoachPlanResponse { id, name, startDate, endDate, planType,
                              ownerId, ownerName, ownerEmail, totalWeeks, createdAt }
interface CreatePlanRequest { name, startDate, endDate }
interface CreatePlanForUserRequest { userId, name, startDate, endDate }
interface UpdatePlanRequest { name, startDate, endDate }
```

### `src/features/workouts/types.ts`
```ts
interface WeeklyWorkoutResponse { id, weekNumber, name, startDate, endDate,
                                  planId, totalDays, completedDays }
interface DailyWorkoutResponse  { id, date, dayOfWeek, isCompleted,
                                  weeklyWorkoutId, totalExercises, completedExercises }
interface ExerciseSetResponse   { id, setNumber, plannedReps, plannedWeight,
                                  actualReps, actualWeight, isCompleted, completedAt }
interface ExerciseResponse      { id, exerciseTemplateId, name,
                                  primaryMuscleGroup, secondaryMuscleGroups,
                                  plannedSets, plannedReps, plannedWeight,
                                  completedSetsCount, isCompleted, notes,
                                  dailyWorkoutId, sets: ExerciseSetResponse[],
                                  personalRecordWeight }
interface ExerciseTemplateResponse { id, name, description, primaryMuscleGroup,
                                     secondaryMuscleGroups }
interface CreateExerciseRequest { dailyWorkoutId, exerciseTemplateId,
                                  plannedSets, plannedReps, plannedWeight?, notes? }
interface UpdateExerciseRequest { plannedSets?, plannedReps?, plannedWeight?, notes? }
interface CompleteSetRequest    { actualReps?, actualWeight? }
```

---

## 5. Hooks đã có sẵn — import và dùng trực tiếp

### Auth
```ts
import { useLogin, useRegister, useLogout } from '@/features/auth'
import { useAuthStore } from '@/features/auth'
// store: { accessToken, user, setAuth(token, refreshToken, user), clear(), isAuthenticated(), hasRole(role) }
```

### Profile
```ts
import { useMyProfile, useUpdateProfile,
         useLogBodyweight, useBodyweightHistory, useDeleteBodyweight } from '@/features/profile'
```

### Coaches
```ts
import { useCoaches } from '@/features/coaches'
// useCoaches({ name?: string })
```

### Coach–Client
```ts
import { useRequestCoach, useAcceptRequest, useTerminateRelationship,
         usePendingRequests, useMyCoach, useMyClients } from '@/features/coach-client'
```

### Plans
```ts
import { usePlans, usePlan, useCreatePlan, useUpdatePlan, useDeletePlan,
         useActivatePlan, useDeactivatePlan,
         useCoachPlanOverview, useCreatePlanForUser } from '@/features/plans'
```

### Workouts
```ts
import { useWeeklyWorkouts, useUpdateWeeklyWorkout } from '@/features/workouts'
import { useDailyWorkouts }                           from '@/features/workouts'
import { useExercises, useCreateExercise, useUpdateExercise,
         useDeleteExercise, useCompleteSet }           from '@/features/workouts'
import { useExerciseTemplates }                        from '@/features/workouts'
// useExerciseTemplates({ muscleGroup?: MuscleGroup })
```

---

## 6. API — URL & hành vi

> Base URL: `VITE_API_URL=http://localhost:5293` (dev). Tất cả URL đã khai báo trong `endpoints.ts`.

### Auth (public)
| Method | URL | Mô tả |
|--------|-----|--------|
| POST | `/api/auth/register` | Đăng ký → trả AuthResponse |
| POST | `/api/auth/login` | Đăng nhập → trả AuthResponse |
| POST | `/api/auth/refresh-token` | Refresh JWT |
| POST | `/api/auth/logout` | Vô hiệu hóa refresh token (204) |

### Users (requires auth)
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/users/me` | Hồ sơ + BMI + DOTS + streak |
| PUT | `/api/users/me` | Cập nhật height/gender/dateOfBirth |
| POST | `/api/users/me/bodyweight` | Log cân nặng hôm nay |
| GET | `/api/users/me/bodyweight` | Lịch sử cân nặng |
| DELETE | `/api/users/me/bodyweight/{id}` | Xóa 1 bản ghi |

### Coaches
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/coaches?name=` | Danh sách coach, filter tên |

### Coach–Client
| Method | URL | Role | Mô tả |
|--------|-----|------|--------|
| POST | `/api/coach-client/request` | Individual | Gửi request kết nối coach |
| PUT | `/api/coach-client/accept/{id}` | Coach | Chấp nhận request |
| DELETE | `/api/coach-client/{id}` | Both | Hủy quan hệ |
| GET | `/api/coach-client/pending-requests` | Coach | Danh sách chờ duyệt |
| GET | `/api/coach-client/my-coach` | Individual | Coach hiện tại (nullable) |
| GET | `/api/coach-client/my-clients` | Coach | Danh sách clients |

### Plans
| Method | URL | Role | Mô tả |
|--------|-----|------|--------|
| GET | `/api/plans` | Any | Kế hoạch của tôi |
| GET | `/api/plans/{id}` | Any | Chi tiết plan |
| POST | `/api/plans` | Any | Tạo plan (auto-gen weeks+days) |
| PUT | `/api/plans/{id}` | Any | Cập nhật tên/ngày |
| DELETE | `/api/plans/{id}` | Any | Xóa plan (cascade) |
| PATCH | `/api/plans/{id}/activate` | Any | Kích hoạt (1 active tại 1 thời điểm) |
| PATCH | `/api/plans/{id}/deactivate` | Any | Tắt active |
| GET | `/api/plans/coach-overview` | Coach | Tất cả plan coach đã tạo cho client |
| POST | `/api/plans/for-user` | Coach | Tạo plan cho 1 client cụ thể |

### Weekly Workouts
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/plans/{planId}/weeks` | Các tuần trong plan + tiến độ |
| PATCH | `/api/plans/{planId}/weeks/{weekId}` | Đổi tên tuần |

### Daily Workouts
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/weeks/{weeklyWorkoutId}/days` | 7 ngày trong tuần + tiến độ |

### Exercises
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/exercises/by-day/{dailyWorkoutId}` | Bài tập trong ngày + sets + PR |
| POST | `/api/exercises` | Thêm bài tập (auto-gen sets) |
| PUT | `/api/exercises/{id}` | Cập nhật thông số |
| DELETE | `/api/exercises/{id}` | Xóa bài tập |
| PATCH | `/api/exercises/sets/{setId}/complete` | Hoàn thành 1 set (ghi actual reps/weight) |

### Exercise Templates
| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/exercise-templates?muscleGroup=` | Danh mục bài tập, filter cơ |

### Lỗi chuẩn
```json
{ "message": "Plan not found or access denied." }
```
| Status | Khi nào |
|--------|---------|
| 400 | Validation fail / business rule |
| 401 | Thiếu token / token hết hạn |
| 403 | Sai role |
| 404 | Không tìm thấy / không có quyền |

---

## 7. Business rules quan trọng cho UI

- **Max 3 plans** / user (cả self + coach-created).
- **1 coach** / user. Khi terminate, coach-created plans bị xóa theo.
- **1 plan active** tại 1 thời điểm — activate plan mới tự deactivate plan cũ.
- `PATCH /sets/{id}/complete` → nếu không truyền actualReps/actualWeight thì backend fallback về planned values.
- Khi tất cả sets của 1 exercise complete → exercise tự mark complete.
- Khi tất cả exercises của 1 day complete → day tự mark complete.
- Streak tính từ WorkoutHistory, grace period 3 ngày (không hiển thị logic này, chỉ hiển thị `currentStreak` từ API).

---

## 8. Routing plan

```
/login                    → AuthLayout → LoginPage
/register                 → AuthLayout → RegisterPage

/ (ProtectedRoute + AppLayout)
  /                       → DashboardPage   (streak, active plan summary, today's workout)
  /plans                  → PlansPage       (list, create, activate)
  /plans/:planId          → PlanDetailPage  (weeks list)
  /plans/:planId/weeks/:weekId → WeekDetailPage (days list)
  /days/:dailyWorkoutId   → DayWorkoutPage  (exercises + sets, complete set)
  /profile                → ProfilePage     (edit info, bodyweight chart/log)
  /coaches                → CoachesPage     (search, request coach) — Individual only
  /coach/clients          → ClientsPage     (pending requests, my clients) — Coach only
  /coach/plans            → CoachPlansPage  (overview plans đã tạo cho client) — Coach only
```

---

## 9. Animation rules

Dùng preset từ `src/shared/utils/motion.ts` — **không tự viết animation mới** nếu đã có preset:

```ts
fadeIn        → opacity 0→1 (200ms)
slideUp       → opacity+y 0→1 (300ms, easeOut) — dùng cho page, list item, toast
scaleIn       → opacity+scale 0.95→1 (200ms) — dùng cho modal, dropdown
staggerContainer → staggerChildren 0.07s — wrap list items
```

Luôn wrap list items trong `<AnimatePresence>` khi có add/remove.  
Luôn dùng `useReducedMotion()` để tắt animation nếu user set OS preference.  
`whileTap={{ scale: 0.97 }}` cho tất cả button interactive.

---

## 10. Quy tắc code (bắt buộc)

### Không được làm
- `any`, `object`, `{}` trong TypeScript.
- `export default` — chỉ dùng named export.
- `useState` cho dữ liệu từ API — dùng TanStack Query.
- Import chéo giữa features (e.g. `plans` import từ `workouts`).
- Hardcode URL — dùng `ENDPOINTS.*`.
- `fetch()` trực tiếp — dùng `api` từ axios.ts.
- `console.log` trong code commit.
- Inline style `style={{}}` — dùng Tailwind.

### Phải làm
- Named export, PascalCase cho component, camelCase cho hook (prefix `use`).
- Zod schema cho mọi form — không validate thủ công.
- Loading + error state cho mọi query.
- Responsive mobile-first (`md:`, `lg:`).
- `cn()` khi class có điều kiện.
- Lazy load tất cả page trong Router.tsx.

### Cấu trúc 1 component
```tsx
import { motion } from 'framer-motion'
import { slideUp } from '@/shared/utils/motion'
import { cn } from '@/shared/utils/cn'
// types import cuối
import type { PlanResponse } from '../types'

interface Props { ... }

export function ComponentName({ ... }: Props) {
  // hooks đầu tiên
  // derived state
  // handlers
  // render
  return (
    <motion.div {...slideUp} className={cn('...')}>
      ...
    </motion.div>
  )
}
```

---

## 11. Styling / Theme

Dark mode first. Màu dùng qua CSS variable — định nghĩa trong `globals.css`:

```css
@theme {
  --color-primary:    #6366f1;   /* Indigo */
  --color-surface:    #1e1e2e;   /* Card bg */
  --color-background: #13131f;   /* Page bg */
  --color-text:       #e2e8f0;
  --color-muted:      #94a3b8;
  --color-success:    #22c55e;
  --color-danger:     #ef4444;
  --color-warning:    #f59e0b;
}
```

Dùng trong JSX: `bg-surface`, `text-muted`, `bg-primary`, v.v.

---

## 12. Env files

```bash
# .env.development
VITE_API_URL=http://localhost:5293

# .env.production
VITE_API_URL=https://api.xenoh.app
```

---

## 13. Checklist trước khi commit

- [ ] `tsc --noEmit` sạch
- [ ] ESLint không có error
- [ ] Không còn `any`, `console.log`
- [ ] Loading & error state đã xử lý
- [ ] Animation có `useReducedMotion` fallback
- [ ] Responsive đã kiểm tra 375px và 1280px
