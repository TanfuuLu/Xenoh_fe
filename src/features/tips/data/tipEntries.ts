import type { Lang } from '@/shared/i18n'

export type TipEntry = {
  title: string
  body: string
  label?: string
}

export const FEATURE_TIP_ENTRIES: Record<Lang, Record<string, TipEntry>> = {
  en: {
    'dashboard-next-actions': {
      label: 'Dashboard tip',
      title: 'Start with the next action',
      body: 'Use the first recommended action as today\'s priority. If training, nutrition, or bodyweight setup is missing, fixing that unlocks better numbers across the dashboard.',
    },
    'exercise-library-browse': {
      label: 'Exercise library tip',
      title: 'Find the right movement faster',
      body: 'Search by exercise name or filter by muscle group before creating a custom exercise. Keep custom names clear so they are easy to reuse in future plans.',
    },
    'plan-builder-focus': {
      label: 'Plan tip',
      title: 'Build plans around repeatable weeks',
      body: 'Start with the main training days and key lifts first. Add accessories after the weekly structure is clear, so the plan stays easy to follow.',
    },
    'plan-detail-editing': {
      label: 'Plan detail tip',
      title: 'Edit the week before the single set',
      body: 'When a plan feels off, check the week structure first: training days, exercise order, then set targets. Small plan edits are easier to coach and track.',
    },
    'week-detail-execution': {
      label: 'Week tip',
      title: 'Keep the week consistent',
      body: 'Use this view to check whether the week matches the goal. If sessions are being missed, reduce complexity before adding more volume.',
    },
    'day-workout-logging': {
      label: 'Workout tip',
      title: 'Log while the set is fresh',
      body: 'Record weight, reps, and RPE during rest periods. Fresh logs make PRs, e1RM, fatigue, and coach feedback more reliable.',
    },
    'progress-reading': {
      label: 'Progress tip',
      title: 'Read trend before one session',
      body: 'A single bad workout is noise. Look at PR timeline, e1RM, DOTS, and volume together before deciding to push, hold, or deload.',
    },
    'profile-bodyweight': {
      label: 'Profile tip',
      title: 'Bodyweight powers multiple metrics',
      body: 'Update bodyweight regularly so BMI, DOTS, nutrition targets, and trend charts stay accurate. Same time of day gives the cleanest trend.',
    },
    'coach-marketplace-fit': {
      label: 'Coach tip',
      title: 'Choose based on fit, not just price',
      body: 'Compare coaching style, response time, methods, and availability. The best coach is the one whose workflow matches your goal and schedule.',
    },
    'coach-client-priorities': {
      label: 'Client dashboard tip',
      title: 'Handle attention flags first',
      body: 'Use inactive, no-plan, and compliance signals to decide who needs help today. A simple next step often beats adding more work.',
    },
    'coach-plan-management': {
      label: 'Coach plan tip',
      title: 'Keep client plans easy to audit',
      body: 'Name plans clearly and keep active blocks current. Clean plan history makes progress reviews and renewals much easier.',
    },
  },
  vi: {
    'dashboard-next-actions': {
      label: 'Tip dashboard',
      title: 'Bắt đầu từ việc nên làm tiếp theo',
      body: 'Ưu tiên action đầu tiên trong danh sách hôm nay. Nếu thiếu setup tập luyện, dinh dưỡng hoặc cân nặng, hãy bổ sung trước để dashboard tính số liệu chính xác hơn.',
    },
    'exercise-library-browse': {
      label: 'Tip thư viện bài tập',
      title: 'Tìm đúng động tác nhanh hơn',
      body: 'Hãy tìm theo tên bài hoặc lọc theo nhóm cơ trước khi tạo bài custom. Đặt tên bài custom rõ ràng để dễ dùng lại trong các plan sau.',
    },
    'plan-builder-focus': {
      label: 'Tip tạo plan',
      title: 'Xây plan quanh tuần có thể lặp lại',
      body: 'Bắt đầu bằng ngày tập chính và các bài quan trọng trước. Thêm bài phụ sau khi cấu trúc tuần đã rõ để plan dễ theo và dễ chỉnh.',
    },
    'plan-detail-editing': {
      label: 'Tip chi tiết plan',
      title: 'Chỉnh tuần trước khi chỉnh từng set',
      body: 'Khi plan chưa ổn, hãy xem cấu trúc tuần trước: ngày tập, thứ tự bài, rồi mới tới mục tiêu set. Chỉnh nhỏ sẽ dễ coach và dễ theo dõi hơn.',
    },
    'week-detail-execution': {
      label: 'Tip tuần tập',
      title: 'Giữ tuần tập nhất quán',
      body: 'Dùng màn này để kiểm tra tuần có khớp mục tiêu không. Nếu hay bỏ buổi, hãy giảm độ phức tạp trước khi thêm volume.',
    },
    'day-workout-logging': {
      label: 'Tip buổi tập',
      title: 'Log khi set còn mới',
      body: 'Ghi tạ, rep và RPE trong lúc nghỉ giữa set. Log ngay giúp PR, e1RM, fatigue và feedback của coach đáng tin hơn.',
    },
    'progress-reading': {
      label: 'Tip tiến độ',
      title: 'Đọc xu hướng trước một buổi đơn lẻ',
      body: 'Một buổi tập tệ có thể chỉ là nhiễu. Hãy xem PR timeline, e1RM, DOTS và volume cùng nhau trước khi quyết định tăng, giữ hay deload.',
    },
    'profile-bodyweight': {
      label: 'Tip hồ sơ',
      title: 'Cân nặng ảnh hưởng nhiều chỉ số',
      body: 'Cập nhật cân nặng đều để BMI, DOTS, mục tiêu dinh dưỡng và biểu đồ xu hướng chính xác hơn. Cân cùng thời điểm mỗi ngày sẽ sạch dữ liệu hơn.',
    },
    'coach-marketplace-fit': {
      label: 'Tip chọn coach',
      title: 'Chọn theo độ phù hợp, không chỉ theo giá',
      body: 'So sánh phong cách coaching, thời gian phản hồi, phương thức làm việc và lịch nhận client. Coach tốt nhất là người hợp mục tiêu và lịch của bạn.',
    },
    'coach-client-priorities': {
      label: 'Tip client',
      title: 'Xử lý cảnh báo trước',
      body: 'Dùng tín hiệu không hoạt động, chưa có plan và mức tuân thủ để biết ai cần hỗ trợ hôm nay. Một bước đơn giản thường hiệu quả hơn thêm nhiều việc.',
    },
    'coach-plan-management': {
      label: 'Tip plan coach',
      title: 'Giữ plan client dễ kiểm tra',
      body: 'Đặt tên plan rõ và giữ block đang hoạt động luôn cập nhật. Lịch sử plan sạch giúp review tiến độ và gia hạn dễ hơn.',
    },
  },
}
