import { format } from 'date-fns'
import type { MuscleGroup as MuscleGroupValue } from '@/shared/types/api'

export function getWeightAnalytics(history: { weight: number; date: string }[]) {
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const chartData = sorted.map((entry) => ({
    dateLabel: format(new Date(entry.date), 'dd/MM'),
    weight: entry.weight,
  }))
  const first = sorted[0]?.weight
  const latest = sorted.length > 0 ? sorted[sorted.length - 1].weight : undefined
  const totalChange = first != null && latest != null ? latest - first : 0
  const averageChange = sorted.length > 1 ? totalChange / (sorted.length - 1) : 0

  return {
    chartData,
    entryCount: sorted.length,
    latest,
    totalChange,
    averageChange,
  }
}

export function formatWeightDelta(value: number, unit: string) {
  const rounded = Math.abs(value) < 0.05 ? 0 : Number(value.toFixed(1))
  if (rounded === 0) return `0 ${unit}`
  return `${rounded > 0 ? '+' : ''}${rounded} ${unit}`
}

export function clientProfileText(lang: 'en' | 'vi') {
  return lang === 'vi'
    ? {
      aiInsight: 'AI phân tích',
      weight: 'Cân nặng',
      trainingPlan: 'Plan tập luyện',
      createPlan: 'Tạo plan',
      clientPlanProgress: 'Tiến độ plan của client',
      noActivePlanInRange: 'Không có plan hoạt động trong khoảng ngày',
      noPlanAssigned: 'Chưa gán plan.',
      createFirstPlan: 'Tạo plan đầu tiên',
      weeks: 'tuần',
      active: 'Đang hoạt động',
      createPlanForClient: 'Tạo plan cho client',
      planName: 'Tên plan',
      startDate: 'Ngày bắt đầu',
      endDate: 'Ngày kết thúc',
      cancel: 'Hủy',
      customExercisesForClient: 'Bài custom cho client',
      addExercise: 'Thêm bài tập',
      customExerciseHint: 'Tạo bài tập custom sẽ xuất hiện trong thư viện bài tập của client này.',
      noCustomExercises: 'Chưa tạo bài custom nào cho client này.',
      editCustomExercise: 'Sửa bài custom',
      deleteCustomExercise: 'Xóa bài custom',
      nutrition: 'Dinh dưỡng',
      nutritionHint: 'Chỉnh TDEE, mục tiêu bulk/cut và log ăn uống hằng ngày của client này.',
      openNutrition: 'Mở dinh dưỡng',
      editCustomExerciseForClient: 'Sửa bài custom cho client',
      createCustomExerciseForClient: 'Tạo bài custom cho client',
      exerciseName: 'Tên bài tập',
      description: 'Mô tả',
      primaryMuscle: 'Nhóm cơ chính',
      exerciseType: 'Loại bài',
      strength: 'Sức mạnh',
      secondaryMuscles: 'Nhóm cơ phụ',
      saveExercise: 'Lưu bài tập',
      createExercise: 'Tạo bài tập',
      bodyweightAnalysis: 'Phân tích cân nặng',
      last90Days: '90 ngày gần nhất',
      entries: 'Số lần ghi',
      totalChange: 'Tổng thay đổi',
      avgChange: 'Thay đổi TB',
      noBodyweightLogs: 'Chưa có log cân nặng.',
      clientFallback: 'Client',
      defaultPlanSuffix: 'Plan tập luyện',
      delete: 'Xóa',
    }
    : {
      aiInsight: 'AI Insight',
      weight: 'Weight',
      trainingPlan: 'Training Plan',
      createPlan: 'Create plan',
      clientPlanProgress: 'Client plan progress',
      noActivePlanInRange: 'No active plan in date range',
      noPlanAssigned: 'No plan assigned yet.',
      createFirstPlan: 'Create first plan',
      weeks: 'weeks',
      active: 'Active',
      createPlanForClient: 'Create plan for client',
      planName: 'Plan name',
      startDate: 'Start date',
      endDate: 'End date',
      cancel: 'Cancel',
      customExercisesForClient: 'Custom exercises for client',
      addExercise: 'Add exercise',
      customExerciseHint: "Create a custom exercise that will appear in this client's exercise library.",
      noCustomExercises: 'No custom exercises created for this client yet.',
      editCustomExercise: 'Edit custom exercise',
      deleteCustomExercise: 'Delete custom exercise',
      nutrition: 'Nutrition',
      nutritionHint: "Edit this client's TDEE, bulk/cut targets, and daily intake logs.",
      openNutrition: 'Open nutrition',
      editCustomExerciseForClient: 'Edit custom exercise for client',
      createCustomExerciseForClient: 'Create custom exercise for client',
      exerciseName: 'Exercise name',
      description: 'Description',
      primaryMuscle: 'Primary muscle',
      exerciseType: 'Exercise type',
      strength: 'Strength',
      secondaryMuscles: 'Secondary muscles',
      saveExercise: 'Save exercise',
      createExercise: 'Create exercise',
      bodyweightAnalysis: 'Bodyweight analysis',
      last90Days: 'Last 90 days',
      entries: 'Entries',
      totalChange: 'Total change',
      avgChange: 'Avg change',
      noBodyweightLogs: 'No bodyweight logs yet.',
      clientFallback: 'Client',
      defaultPlanSuffix: 'Training Plan',
      delete: 'Delete',
    }
}

export function formatMuscleGroup(group: MuscleGroupValue, lang: 'en' | 'vi') {
  if (lang === 'vi') {
    const map: Partial<Record<MuscleGroupValue, string>> = {
      Chest: 'Ngực',
      Back: 'Lưng',
      Shoulders: 'Vai',
      Biceps: 'Tay trước',
      Triceps: 'Tay sau',
      Forearms: 'Cẳng tay',
      Abs: 'Bụng',
      Glutes: 'Mông',
      Quads: 'Đùi trước',
      Hamstrings: 'Đùi sau',
      Calves: 'Bắp chân',
      FullBody: 'Toàn thân',
      Cardio: 'Cardio',
      Traps: 'Cầu vai',
      Neck: 'Cổ',
      Adductors: 'Đùi trong',
      Abductors: 'Đùi ngoài',
    }
    return map[group] ?? group.replace(/([a-z])([A-Z])/g, '$1 $2')
  }
  return group.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function translateExerciseKind(kind: string, lang: 'en' | 'vi') {
  if (lang !== 'vi') return kind
  return kind === 'Strength' ? 'Sức mạnh' : kind
}
