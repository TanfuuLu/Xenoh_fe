import { api } from '@/shared/api/axios'
import { ENDPOINTS } from '@/shared/api/endpoints'

export async function exportPlanCsv(planId: string): Promise<void> {
  const response = await api.get<Blob>(ENDPOINTS.plans.exportCsv(planId), {
    responseType: 'blob',
  })

  // Content-Disposition: attachment; filename="plan-name-2025-01-01.csv"
  const disposition: string = response.headers['content-disposition'] ?? ''
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  const fileName = match?.[1]?.replace(/['"]/g, '') ?? `plan-${planId}.xlsx`

  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
