import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { useLangStore } from '@/shared/i18n'
import '@/styles/marketing.css'

const landingCopy = {
  en: {
    nav: {
      how: 'How it works',
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
      about: 'About',
      signIn: 'Sign in',
      startFree: 'Start free ->',
    },
    hero: {
      eyebrow: 'For individuals and coaches',
      title: <>Plan the work.<br />Then do it.</>,
      lede: 'Xenoh is a training journal for people who are serious about the plan - and for the coaches who write them. Weekly planning, live session logging, and a shared record that both sides trust.',
      primary: 'Create free account',
      secondary: 'See how it works ->',
      today: 'Today - push',
      workout: 'Bench - overhead - fly',
      sets: '3 of 5 sets - bench press',
      overhead: 'Overhead press',
    },
    stats: [
      { num: '12k', suffix: '+', lbl: 'Active lifters', desc: 'Logging sessions every week across 40+ countries.' },
      { num: '2.3M', suffix: '', lbl: 'Sets logged', desc: 'Reps, weights, RPE - every one saved to your journal.' },
      { num: '94', suffix: '%', lbl: 'Plan compliance', desc: 'Average weekly completion for coach-authored plans.' },
      { num: '<2', suffix: 's', lbl: 'Log a set', desc: 'Tap the weight, tap the reps. Back to the bar.' },
    ],
    logoBar: {
      label: 'Used by coaches at',
      names: ['Steel & Stone', 'Northline Athletics', 'Fieldhouse', 'Hearth Strength', 'Kiln Barbell Club'],
    },
    how: {
      eyebrow: 'How it works',
      title: 'From blank week to finished session.',
      desc: 'Three steps - the same three, whether you are planning your own training or writing a program for someone else.',
      view: 'View features',
      steps: [
        {
          n: '01', h: 'Lay out the week.',
          p: 'Drag exercises from the library onto each day. Set target reps, weights, rest. Duplicate last week when it is working.',
          tag: 'about 5 minutes on sunday',
        },
        {
          n: '02', h: 'Show up and log.',
          p: "Session view opens to today's work. Tap through sets as you finish them - the app remembers weights and autofills the next rep target.",
          tag: 'live during training',
        },
        {
          n: '03', h: "See what's working.",
          p: 'Weekly summary shows completion, volume by muscle group, and PRs. Coach gets the same view for every client on the roster.',
          tag: 'automatic - no reports to write',
        },
      ],
    },
    plan: {
      eyebrow: 'Plan builder',
      title: 'A week, laid out like a journal.',
      desc: 'Add exercises to the day they belong. Set reps, weights, rest. Nothing more complicated than that.',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
      exercises: [
        { name: 'Bench press', sets: 5, reps: 5, weight: 80 },
        { name: 'Overhead press', sets: 4, reps: 8, weight: 45 },
        { name: 'Cable fly', sets: 3, reps: 12, weight: 15 },
      ],
      bullets: [
        'Exercise templates with primary and secondary muscle groups',
        'Self-planned or authored by your coach',
        'Weekly view with completion at a glance',
        'Up to 3 concurrent training plans',
      ],
    },
    coach: {
      eyebrow: 'For coaches',
      title: 'Write the plan once. See every set they log.',
      desc: 'Invite a client by email. Once they accept, the plan you author lives in their app - and every rep they complete lives in yours.',
      bullets: [
        'One roster, compliance at a glance',
        'Plan templates you can drop on any client',
        'Notes on the exercise, not in a separate tab',
        'Coach dashboard with Big 3 PRs and last workout',
      ],
      clients: [
        { init: 'MA', name: 'Marco Aliaga', plan: 'Push / pull / legs - wk 3', stat: '18 / 24' },
        { init: 'JS', name: 'Jun Soh', plan: 'Strength block - wk 1', stat: '3 / 18' },
        { init: 'RD', name: 'Rosa Daza', plan: 'Hypertrophy - wk 5', stat: '27 / 30' },
      ],
    },
    grid: {
      eyebrow: 'Everything included',
      title: 'The whole journal. Nothing extra.',
      desc: 'Every feature is in every plan. There is no "Pro tier" for tracking your own reps.',
      view: 'View pricing',
      cells: [
        { ico: '📚', h: 'Exercise library', p: '700+ movements with primary and secondary muscle groups, tagged for quick filtering.' },
        { ico: '📋', h: 'Plan templates', p: 'Save any week as a template. Drop it on any client, tweak reps, done.' },
        { ico: '🏆', h: 'PR tracking', p: 'Your best lift at every rep range, automatically. No spreadsheet required.' },
        { ico: '📊', h: 'Progress charts', p: 'Bodyweight history and workout trends over time, visible to both coach and client.' },
        { ico: '📱', h: 'Mobile-first', p: 'The session view was designed thumb-up, one-handed, mid-rest between sets.' },
        { ico: '📤', h: 'Full data export', p: 'Every plan and every log exports to CSV. Your training history belongs to you.' },
      ],
    },
    testimonial: {
      quote: '"I stopped rewriting the same spreadsheet every Sunday. My clients see exactly what I wrote, and I see every set they finish."',
      who: 'head coach, Hearth Strength',
    },
    pricing: {
      eyebrow: 'Pricing',
      title: "Three plans. That's it.",
      desc: "Start free, upgrade with User's Plan, or run clients with Coach.",
      soloAria: 'Start Solo free',
      soloTier: 'Individual',
      soloName: 'Solo',
      soloPrice: 'Free',
      soloUnit: ' - forever',
      soloDesc: 'For anyone planning their own training.',
      soloButton: 'Start free',
      userAria: "Start User's Plan",
      userTier: 'User',
      userName: "User's Plan",
      userPrice: '10k',
      userUnit: ' VND / month',
      userDesc: 'For users who want more room and deeper progress tools.',
      userButton: 'Upgrade your plan',
      coachAria: 'Start Coach 30-day trial',
      coachTier: 'Coach',
      coachName: 'Coach',
      coachPrice: '$8',
      coachUnit: ' / active client / month',
      coachDesc: 'Everything in Solo, plus the tools to run a roster.',
      coachButton: 'Start a 30-day trial',
      soloFeatures: ['Unlimited plans and sessions', 'Full exercise library', 'Progress history and PRs', 'Accept plans from a coach', 'CSV export'],
      userFeatures: ['Everything in Solo', 'Unlimited training plans', 'Advanced training analytics', 'Advanced nutrition analysis', 'AI insights for your own progress'],
      coachFeatures: ['Unlimited clients - billed only when active', 'Plan templates and bulk assignment', 'Compliance reports per client', 'Coach dashboard with client stats', 'Priority support within 1 business day'],
    },
    faq: {
      eyebrow: 'Common questions',
      title: 'What people ask first.',
      readMore: 'Read more about Xenoh',
      qs: [
        { q: "What does 'active client' mean?", a: "An active client is anyone on your roster who logged at least one set in the month. If a client takes a week off, you're not billed for them. We bill daily, prorated." },
        { q: 'Does it work offline?', a: "The session view works fully offline - tap through sets, log weights, everything. When you're back online the data syncs. We assume gyms have bad reception." },
        { q: 'Can I use it without a coach?', a: 'Absolutely. The Solo plan is free forever. You can create your own plans, log sessions, and track progress with no coach involved.' },
        { q: 'Who owns the data?', a: 'You do. Every plan and every logged set can be exported to CSV at any time, no questions asked. If you close your account, we delete everything within 30 days.' },
        { q: 'Can clients see the plans their coach wrote?', a: "Yes. Coach-authored plans appear directly in the client's app. The client can log sets and mark exercises done. The coach sees every update in real time." },
        { q: 'How does the coach-client relationship work?', a: 'The client searches for a coach and sends a request. Once the coach accepts, they can create plans for that client. Either side can terminate the relationship at any time.' },
      ],
    },
    cta: {
      title: <>Plan the work.<br />Then do it.</>,
      desc: "Start free, upgrade with User's Plan, or try Coach for 30 days. No credit card required.",
      button: 'Create your account ->',
    },
    footer: {
      tag: 'A training journal for people who are serious about the plan - and for the coaches who write them.',
      product: 'Product',
      productLinks: ['Plan builder', 'Session logging', 'Exercise library', 'PR tracking'],
      coaches: 'Coaches',
      coachLinks: ['For coaches', 'Pricing', 'How it works'],
      company: 'Company',
      companyLinks: ['About', 'Sign in', 'Get started'],
      copyright: '© 2026 Xenoh. All rights reserved.',
      madeFor: 'Made for people who show up.',
    },
  },
  vi: {
    nav: {
      how: 'Cách hoạt động',
      features: 'Tính năng',
      pricing: 'Bảng giá',
      faq: 'FAQ',
      about: 'Giới thiệu',
      signIn: 'Đăng nhập',
      startFree: 'Bắt đầu miễn phí ->',
    },
    hero: {
      eyebrow: 'Dành cho cá nhân và huấn luyện viên',
      title: <>Lên kế hoạch tập.<br />Rồi thực hiện.</>,
      lede: 'Xenoh là nhật ký tập luyện dành cho người nghiêm túc với kế hoạch của mình - và cho những huấn luyện viên viết ra các kế hoạch đó. Lên lịch theo tuần, ghi buổi tập trực tiếp, và cùng tin vào một lịch sử tập luyện rõ ràng.',
      primary: 'Tạo tài khoản miễn phí',
      secondary: 'Xem cách hoạt động ->',
      today: 'Hôm nay - đẩy',
      workout: 'Bench - vai - fly',
      sets: '3 trên 5 hiệp - bench press',
      overhead: 'Đẩy vai',
    },
    stats: [
      { num: '12k', suffix: '+', lbl: 'Người tập đang hoạt động', desc: 'Ghi nhận buổi tập mỗi tuần tại hơn 40 quốc gia.' },
      { num: '2.3M', suffix: '', lbl: 'Hiệp đã ghi nhận', desc: 'Số lần lặp, mức tạ, RPE - mọi dữ liệu đều được lưu vào nhật ký.' },
      { num: '94', suffix: '%', lbl: 'Mức hoàn thành kế hoạch', desc: 'Tỷ lệ hoàn thành trung bình hằng tuần của các kế hoạch do coach viết.' },
      { num: '<2', suffix: 's', lbl: 'Ghi một hiệp', desc: 'Chạm mức tạ, chạm số reps. Quay lại tập ngay.' },
    ],
    logoBar: {
      label: 'Được các coach sử dụng tại',
      names: ['Steel & Stone', 'Northline Athletics', 'Fieldhouse', 'Hearth Strength', 'Kiln Barbell Club'],
    },
    how: {
      eyebrow: 'Cách hoạt động',
      title: 'Từ một tuần trống đến buổi tập hoàn tất.',
      desc: 'Ba bước đơn giản - dù bạn tự lên kế hoạch cho mình hay viết giáo án cho người khác.',
      view: 'Xem tính năng',
      steps: [
        {
          n: '01', h: 'Sắp xếp tuần tập.',
          p: 'Kéo bài tập từ thư viện vào từng ngày. Đặt mục tiêu reps, mức tạ và thời gian nghỉ. Sao chép tuần trước khi lịch đó đang hiệu quả.',
          tag: 'khoảng 5 phút vào chủ nhật',
        },
        {
          n: '02', h: 'Đến buổi tập và ghi lại.',
          p: 'Màn hình buổi tập mở đúng lịch hôm nay. Chạm qua từng hiệp khi hoàn thành - ứng dụng nhớ mức tạ và tự gợi ý mục tiêu reps tiếp theo.',
          tag: 'ghi trực tiếp khi tập',
        },
        {
          n: '03', h: 'Nhìn ra điều đang hiệu quả.',
          p: 'Tổng kết tuần hiển thị mức hoàn thành, volume theo nhóm cơ và PR. Coach cũng xem được cùng một dữ liệu cho từng học viên.',
          tag: 'tự động - không cần viết báo cáo',
        },
      ],
    },
    plan: {
      eyebrow: 'Trình tạo kế hoạch',
      title: 'Một tuần tập, rõ như nhật ký.',
      desc: 'Thêm bài tập vào đúng ngày. Đặt reps, mức tạ, thời gian nghỉ. Chỉ vậy thôi.',
      days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      labels: ['Đẩy', 'Kéo', 'Chân', 'Đẩy', 'Kéo', 'Chân', 'Nghỉ'],
      exercises: [
        { name: 'Bench press', sets: 5, reps: 5, weight: 80 },
        { name: 'Đẩy vai', sets: 4, reps: 8, weight: 45 },
        { name: 'Cable fly', sets: 3, reps: 12, weight: 15 },
      ],
      bullets: [
        'Mẫu bài tập có nhóm cơ chính và phụ',
        'Tự lên kế hoạch hoặc nhận kế hoạch từ coach',
        'Xem theo tuần với trạng thái hoàn thành rõ ràng',
        'Tối đa 3 kế hoạch tập đồng thời',
      ],
    },
    coach: {
      eyebrow: 'Dành cho coach',
      title: 'Viết kế hoạch một lần. Theo dõi từng hiệp học viên ghi lại.',
      desc: 'Mời học viên bằng email. Khi họ chấp nhận, kế hoạch bạn viết sẽ nằm trong app của họ - và từng rep họ hoàn thành sẽ hiển thị trong app của bạn.',
      bullets: [
        'Một danh sách học viên, xem mức hoàn thành trong nháy mắt',
        'Mẫu kế hoạch có thể áp dụng nhanh cho bất kỳ học viên nào',
        'Ghi chú ngay trên bài tập, không phải mở tab khác',
        'Dashboard coach với PR Big 3 và buổi tập gần nhất',
      ],
      clients: [
        { init: 'MA', name: 'Marco Aliaga', plan: 'Đẩy / kéo / chân - tuần 3', stat: '18 / 24' },
        { init: 'JS', name: 'Jun Soh', plan: 'Khối sức mạnh - tuần 1', stat: '3 / 18' },
        { init: 'RD', name: 'Rosa Daza', plan: 'Hypertrophy - tuần 5', stat: '27 / 30' },
      ],
    },
    grid: {
      eyebrow: 'Bao gồm đầy đủ',
      title: 'Toàn bộ nhật ký. Không thêm thứ rườm rà.',
      desc: 'Mọi tính năng cốt lõi đều nằm trong các gói. Không cần một tầng "Pro" chỉ để ghi reps của chính bạn.',
      view: 'Xem bảng giá',
      cells: [
        { ico: '📚', h: 'Thư viện bài tập', p: 'Hơn 700 động tác với nhóm cơ chính và phụ, được gắn thẻ để lọc nhanh.' },
        { ico: '📋', h: 'Mẫu kế hoạch', p: 'Lưu bất kỳ tuần nào thành mẫu. Áp dụng cho học viên, chỉnh reps, xong.' },
        { ico: '🏆', h: 'Theo dõi PR', p: 'Tự động ghi nhận mức tốt nhất của bạn ở từng rep range. Không cần spreadsheet.' },
        { ico: '📊', h: 'Biểu đồ tiến độ', p: 'Lịch sử cân nặng và xu hướng tập luyện theo thời gian, coach và học viên đều xem được.' },
        { ico: '📱', h: 'Ưu tiên mobile', p: 'Màn hình buổi tập được thiết kế để dùng bằng một tay trong lúc nghỉ giữa hiệp.' },
        { ico: '📤', h: 'Xuất toàn bộ dữ liệu', p: 'Mọi kế hoạch và log tập đều xuất được CSV. Lịch sử tập luyện thuộc về bạn.' },
      ],
    },
    testimonial: {
      quote: '"Tôi không còn phải viết lại cùng một spreadsheet mỗi Chủ nhật. Học viên thấy đúng kế hoạch tôi viết, còn tôi thấy từng hiệp họ hoàn thành."',
      who: 'head coach, Hearth Strength',
    },
    pricing: {
      eyebrow: 'Bảng giá',
      title: 'Ba gói. Chỉ vậy thôi.',
      desc: "Bắt đầu miễn phí, nâng cấp với User's Plan, hoặc quản lý học viên bằng Coach.",
      soloAria: 'Bắt đầu Solo miễn phí',
      soloTier: 'Cá nhân',
      soloName: 'Solo',
      soloPrice: 'Miễn phí',
      soloUnit: ' - mãi mãi',
      soloDesc: 'Dành cho người tự lên kế hoạch tập luyện.',
      soloButton: 'Bắt đầu miễn phí',
      userAria: "Bắt đầu User's Plan",
      userTier: 'User',
      userName: "User's Plan",
      userPrice: '10k',
      userUnit: ' VND / tháng',
      userDesc: 'Dành cho người muốn nhiều không gian hơn và công cụ theo dõi sâu hơn.',
      userButton: 'Nâng cấp gói',
      coachAria: 'Bắt đầu dùng thử Coach 30 ngày',
      coachTier: 'Coach',
      coachName: 'Coach',
      coachPrice: '$8',
      coachUnit: ' / học viên hoạt động / tháng',
      coachDesc: 'Bao gồm mọi thứ trong Solo, cộng thêm công cụ để quản lý danh sách học viên.',
      coachButton: 'Dùng thử 30 ngày',
      soloFeatures: ['Kế hoạch và buổi tập không giới hạn', 'Thư viện bài tập đầy đủ', 'Lịch sử tiến độ và PR', 'Nhận kế hoạch từ coach', 'Xuất CSV'],
      userFeatures: ['Mọi thứ trong Solo', 'Kế hoạch tập không giới hạn', 'Phân tích tập luyện nâng cao', 'Phân tích dinh dưỡng nâng cao', 'AI insights cho tiến độ cá nhân'],
      coachFeatures: ['Học viên không giới hạn - chỉ tính phí khi hoạt động', 'Mẫu kế hoạch và gán hàng loạt', 'Báo cáo mức hoàn thành theo học viên', 'Dashboard coach với thống kê học viên', 'Hỗ trợ ưu tiên trong 1 ngày làm việc'],
    },
    faq: {
      eyebrow: 'Câu hỏi thường gặp',
      title: 'Những điều mọi người hỏi trước.',
      readMore: 'Đọc thêm về Xenoh',
      qs: [
        { q: "'Học viên hoạt động' nghĩa là gì?", a: 'Học viên hoạt động là người trong danh sách của bạn có ghi ít nhất một hiệp trong tháng. Nếu học viên nghỉ một tuần, bạn không bị tính phí cho họ. Phí được tính theo ngày và chia theo tỷ lệ.' },
        { q: 'Có dùng offline được không?', a: 'Màn hình buổi tập hoạt động offline đầy đủ - chạm qua hiệp, ghi mức tạ, mọi thứ. Khi online lại, dữ liệu sẽ đồng bộ. Chúng tôi biết phòng gym thường sóng yếu.' },
        { q: 'Tôi có thể dùng mà không cần coach không?', a: 'Hoàn toàn được. Gói Solo miễn phí mãi mãi. Bạn có thể tự tạo kế hoạch, ghi buổi tập và theo dõi tiến độ mà không cần coach.' },
        { q: 'Ai sở hữu dữ liệu?', a: 'Bạn sở hữu dữ liệu. Mọi kế hoạch và log tập đều có thể xuất CSV bất cứ lúc nào. Nếu bạn đóng tài khoản, chúng tôi xoá mọi dữ liệu trong vòng 30 ngày.' },
        { q: 'Học viên có thấy kế hoạch coach viết không?', a: 'Có. Kế hoạch do coach viết sẽ xuất hiện trực tiếp trong app của học viên. Học viên ghi hiệp và đánh dấu bài đã xong. Coach thấy mọi cập nhật theo thời gian thực.' },
        { q: 'Quan hệ coach-học viên hoạt động thế nào?', a: 'Học viên tìm coach và gửi yêu cầu. Khi coach chấp nhận, coach có thể tạo kế hoạch cho học viên đó. Hai bên đều có thể kết thúc quan hệ bất cứ lúc nào.' },
      ],
    },
    cta: {
      title: <>Lên kế hoạch tập.<br />Rồi thực hiện.</>,
      desc: "Bắt đầu miễn phí, nâng cấp với User's Plan, hoặc thử Coach trong 30 ngày. Không cần thẻ tín dụng.",
      button: 'Tạo tài khoản ->',
    },
    footer: {
      tag: 'Nhật ký tập luyện dành cho người nghiêm túc với kế hoạch - và cho những coach viết ra các kế hoạch đó.',
      product: 'Sản phẩm',
      productLinks: ['Trình tạo kế hoạch', 'Ghi buổi tập', 'Thư viện bài tập', 'Theo dõi PR'],
      coaches: 'Coach',
      coachLinks: ['Dành cho coach', 'Bảng giá', 'Cách hoạt động'],
      company: 'Công ty',
      companyLinks: ['Giới thiệu', 'Đăng nhập', 'Bắt đầu'],
      copyright: '© 2026 Xenoh. Đã đăng ký mọi quyền.',
      madeFor: 'Dành cho những người thật sự xuất hiện và tập.',
    },
  },
} as const

const polishedLandingCopyVi = {
  nav: {
    how: 'Cách hoạt động',
    features: 'Tính năng',
    pricing: 'Bảng giá',
    faq: 'FAQ',
    about: 'Giới thiệu',
    signIn: 'Đăng nhập',
    startFree: 'Bắt đầu miễn phí ->',
  },
  hero: {
    eyebrow: 'Dành cho người tự tập và huấn luyện viên',
    title: <>Lên kế hoạch rõ ràng.<br />Tập luyện có kỷ luật.</>,
    lede: 'Xenoh giúp bạn biến kế hoạch tập luyện thành một quy trình dễ theo dõi mỗi ngày. Người tự tập có nơi để xây giáo án, ghi lại từng hiệp và nhìn thấy tiến bộ theo thời gian. Huấn luyện viên có một không gian chung để giao bài, theo dõi mức hoàn thành và hiểu tình trạng của từng học viên mà không phải lục lại spreadsheet hay tin nhắn rời rạc.',
    primary: 'Tạo tài khoản miễn phí',
    secondary: 'Xem cách Xenoh hoạt động ->',
    today: 'Hôm nay - ngày đẩy',
    workout: 'Bench - vai - fly',
    sets: 'Đã hoàn thành 3/5 hiệp - bench press',
    overhead: 'Đẩy vai',
  },
  stats: [
    { num: '12k', suffix: '+', lbl: 'Người tập đang sử dụng', desc: 'Theo dõi lịch tập, buổi tập và tiến độ hằng tuần trên Xenoh.' },
    { num: '2.3M', suffix: '', lbl: 'Hiệp tập đã ghi nhận', desc: 'Từ mức tạ, số reps đến RPE, mọi dữ liệu quan trọng đều được lưu lại có hệ thống.' },
    { num: '94', suffix: '%', lbl: 'Mức hoàn thành kế hoạch', desc: 'Tỷ lệ hoàn thành trung bình của các giáo án được huấn luyện viên giao cho học viên.' },
    { num: '<2', suffix: 's', lbl: 'Ghi một hiệp tập', desc: 'Chọn mức tạ, nhập số reps, lưu lại và quay về buổi tập ngay.' },
  ],
  logoBar: {
    label: 'Được các đội ngũ huấn luyện sử dụng tại',
    names: ['Steel & Stone', 'Northline Athletics', 'Fieldhouse', 'Hearth Strength', 'Kiln Barbell Club'],
  },
  how: {
    eyebrow: 'Cách hoạt động',
    title: 'Từ tuần tập trống đến buổi tập hoàn chỉnh.',
    desc: 'Xenoh giữ quy trình thật gọn: lập kế hoạch, thực hiện buổi tập, rồi xem lại dữ liệu để điều chỉnh. Cùng một luồng làm việc đó phù hợp cho cả người tự tập lẫn coach đang quản lý nhiều học viên.',
    view: 'Xem tính năng',
    steps: [
      {
        n: '01',
        h: 'Xây dựng tuần tập.',
        p: 'Chọn bài tập từ thư viện, đặt mục tiêu reps, mức tạ, thời gian nghỉ và ghi chú kỹ thuật. Nếu tuần trước đang hiệu quả, bạn có thể dùng lại cấu trúc đó rồi tinh chỉnh thay vì bắt đầu từ con số không.',
        tag: 'khoảng 5 phút để lên khung tuần',
      },
      {
        n: '02',
        h: 'Tập và ghi lại ngay tại phòng gym.',
        p: 'Màn hình buổi tập mở đúng lịch hôm nay, hiển thị từng bài theo thứ tự. Bạn chỉ cần chạm qua từng hiệp khi hoàn thành; Xenoh giữ lại dữ liệu để lần sau việc nhập liệu nhanh hơn.',
        tag: 'ghi trực tiếp trong lúc tập',
      },
      {
        n: '03',
        h: 'Đọc dữ liệu để biết nên chỉnh gì.',
        p: 'Sau mỗi tuần, bạn thấy rõ mức hoàn thành, volume theo nhóm cơ, tiến độ cân nặng và các PR mới. Coach cũng có cùng góc nhìn đó cho từng học viên, nên việc trao đổi và điều chỉnh giáo án có căn cứ hơn.',
        tag: 'tổng hợp tự động, không cần báo cáo thủ công',
      },
    ],
  },
  plan: {
    eyebrow: 'Trình tạo kế hoạch',
    title: 'Một tuần tập được sắp xếp như một nhật ký rõ ràng.',
    desc: 'Mỗi ngày có bài tập, mục tiêu và ghi chú riêng. Bạn nhìn vào là biết hôm nay cần làm gì, đã hoàn thành đến đâu và tuần sau nên tiếp tục như thế nào.',
    days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    labels: ['Đẩy', 'Kéo', 'Chân', 'Đẩy', 'Kéo', 'Chân', 'Nghỉ'],
    exercises: [
      { name: 'Bench press', sets: 5, reps: 5, weight: 80 },
      { name: 'Đẩy vai', sets: 4, reps: 8, weight: 45 },
      { name: 'Cable fly', sets: 3, reps: 12, weight: 15 },
    ],
    bullets: [
      'Thư viện bài tập có nhóm cơ chính, nhóm cơ phụ và thông tin để lọc nhanh',
      'Tự tạo giáo án cá nhân hoặc nhận giáo án trực tiếp từ coach',
      'Xem tuần tập theo ngày, theo trạng thái hoàn thành và theo khối lượng công việc',
      'Quản lý tối đa 3 kế hoạch tập song song ở gói miễn phí',
    ],
  },
  coach: {
    eyebrow: 'Dành cho coach',
    title: 'Giao giáo án một lần, theo dõi toàn bộ quá trình thực hiện.',
    desc: 'Khi học viên chấp nhận kết nối, giáo án bạn viết sẽ xuất hiện trực tiếp trong tài khoản của họ. Họ ghi lại từng hiệp trong buổi tập, còn bạn theo dõi được mức hoàn thành, phản hồi và tiến độ mà không phải gom dữ liệu từ nhiều nơi.',
    bullets: [
      'Một danh sách học viên tập trung, có trạng thái và mức hoàn thành rõ ràng',
      'Mẫu kế hoạch có thể tái sử dụng cho nhiều học viên nhưng vẫn dễ cá nhân hóa',
      'Ghi chú nằm ngay trên bài tập để học viên đọc đúng lúc cần thực hiện',
      'Dashboard coach hiển thị PR quan trọng, buổi tập gần nhất và xu hướng tiến bộ',
    ],
    clients: [
      { init: 'MA', name: 'Marco Aliaga', plan: 'Đẩy / kéo / chân - tuần 3', stat: '18 / 24' },
      { init: 'JS', name: 'Jun Soh', plan: 'Khối sức mạnh - tuần 1', stat: '3 / 18' },
      { init: 'RD', name: 'Rosa Daza', plan: 'Hypertrophy - tuần 5', stat: '27 / 30' },
    ],
  },
  grid: {
    eyebrow: 'Tính năng cốt lõi',
    title: 'Mọi thứ cần thiết cho một nhật ký tập luyện nghiêm túc.',
    desc: 'Xenoh tập trung vào những việc thật sự ảnh hưởng đến quá trình tập: lập kế hoạch, ghi dữ liệu, xem lại tiến độ và phối hợp giữa coach với học viên.',
    view: 'Xem bảng giá',
    cells: [
      { ico: '📚', h: 'Thư viện bài tập', p: 'Hơn 700 động tác được phân loại theo nhóm cơ chính, nhóm cơ phụ và mục đích sử dụng để bạn chọn bài nhanh hơn.' },
      { ico: '📋', h: 'Mẫu kế hoạch', p: 'Lưu những tuần tập hiệu quả thành mẫu, áp dụng lại cho bản thân hoặc cho học viên rồi tinh chỉnh theo mục tiêu cụ thể.' },
      { ico: '🏆', h: 'Theo dõi PR', p: 'Xenoh tự động ghi nhận các mốc tốt nhất theo từng rep range, giúp bạn nhìn thấy tiến bộ mà không cần tự lọc dữ liệu.' },
      { ico: '📊', h: 'Biểu đồ tiến độ', p: 'Theo dõi cân nặng, xu hướng tập luyện và mức hoàn thành qua thời gian để điều chỉnh kế hoạch có cơ sở hơn.' },
      { ico: '📱', h: 'Tối ưu cho điện thoại', p: 'Màn hình buổi tập được thiết kế để thao tác nhanh giữa các hiệp, ít chữ thừa và dễ dùng bằng một tay.' },
      { ico: '📤', h: 'Xuất dữ liệu đầy đủ', p: 'Mọi kế hoạch và lịch sử ghi buổi tập đều có thể xuất ra CSV. Dữ liệu tập luyện vẫn thuộc về bạn.' },
    ],
  },
  testimonial: {
    quote: '"Tôi không còn phải viết lại cùng một bảng tính vào mỗi Chủ nhật. Học viên thấy đúng giáo án tôi giao, còn tôi thấy được từng hiệp họ đã hoàn thành."',
    who: 'head coach, Hearth Strength',
  },
  pricing: {
    eyebrow: 'Bảng giá',
    title: 'Ba gói rõ ràng cho ba nhu cầu khác nhau.',
    desc: "Bắt đầu miễn phí nếu bạn tự tập, nâng cấp User's Plan khi cần nhiều phân tích hơn, hoặc dùng Coach để quản lý học viên một cách chuyên nghiệp.",
    soloAria: 'Bắt đầu gói Solo miễn phí',
    soloTier: 'Cá nhân',
    soloName: 'Solo',
    soloPrice: 'Miễn phí',
    soloUnit: ' - mãi mãi',
    soloDesc: 'Phù hợp cho người tự lên kế hoạch, ghi buổi tập và theo dõi tiến độ cơ bản.',
    soloButton: 'Bắt đầu miễn phí',
    userAria: "Bắt đầu User's Plan",
    userTier: 'Người tập',
    userName: "User's Plan",
    userPrice: '10k',
    userUnit: ' VND / tháng',
    userDesc: 'Dành cho người muốn mở rộng kế hoạch, xem phân tích sâu hơn và có thêm AI insights cho quá trình tập.',
    userButton: 'Nâng cấp gói',
    coachAria: 'Bắt đầu dùng thử gói Coach 30 ngày',
    coachTier: 'Coach',
    coachName: 'Coach',
    coachPrice: '$8',
    coachUnit: ' / học viên hoạt động / tháng',
    coachDesc: 'Dành cho huấn luyện viên cần giao giáo án, quản lý học viên và theo dõi tiến độ từ một dashboard tập trung.',
    coachButton: 'Dùng thử 30 ngày',
    soloFeatures: ['Tạo và ghi kế hoạch tập cơ bản', 'Truy cập thư viện bài tập đầy đủ', 'Theo dõi lịch sử tập và PR', 'Nhận giáo án từ coach', 'Xuất dữ liệu CSV'],
    userFeatures: ['Bao gồm mọi tính năng của Solo', 'Kế hoạch tập không giới hạn', 'Phân tích tập luyện nâng cao', 'Phân tích dinh dưỡng nâng cao', 'AI insights cho tiến độ cá nhân'],
    coachFeatures: ['Không giới hạn số học viên trong roster', 'Chỉ tính phí khi học viên hoạt động', 'Mẫu giáo án và gán kế hoạch hàng loạt', 'Báo cáo mức hoàn thành theo từng học viên', 'Dashboard coach với thống kê tiến độ học viên'],
  },
  faq: {
    eyebrow: 'Câu hỏi thường gặp',
    title: 'Những điều người dùng thường muốn biết trước.',
    readMore: 'Đọc thêm về Xenoh',
    qs: [
      { q: "'Học viên hoạt động' nghĩa là gì?", a: 'Học viên hoạt động là người trong roster của coach có ghi nhận ít nhất một hiệp tập trong tháng. Nếu học viên tạm nghỉ và không phát sinh dữ liệu tập, coach sẽ không bị tính phí cho học viên đó trong khoảng thời gian tương ứng.' },
      { q: 'Có dùng được khi phòng gym mất mạng không?', a: 'Có. Màn hình buổi tập được thiết kế để bạn vẫn có thể ghi hiệp, mức tạ và reps trong lúc offline. Khi kết nối trở lại, dữ liệu sẽ được đồng bộ để lịch sử tập luyện không bị đứt đoạn.' },
      { q: 'Tôi có thể dùng Xenoh mà không cần coach không?', a: 'Hoàn toàn có thể. Gói Solo dành cho người tự tập và miễn phí lâu dài. Bạn có thể tự tạo kế hoạch, ghi buổi tập, theo dõi PR và xem lại tiến độ mà không cần kết nối với huấn luyện viên.' },
      { q: 'Dữ liệu tập luyện thuộc về ai?', a: 'Dữ liệu thuộc về bạn. Xenoh cho phép xuất kế hoạch và log tập ra CSV khi cần. Nếu bạn đóng tài khoản, dữ liệu cá nhân sẽ được xử lý theo chính sách lưu trữ và xóa dữ liệu của hệ thống.' },
      { q: 'Học viên có thấy giáo án coach giao không?', a: 'Có. Khi coach giao kế hoạch, giáo án sẽ hiển thị trực tiếp trong tài khoản của học viên. Học viên ghi lại từng hiệp trong quá trình tập, và coach có thể theo dõi cập nhật đó gần như theo thời gian thực.' },
      { q: 'Quan hệ coach và học viên được thiết lập thế nào?', a: 'Học viên có thể tìm coach và gửi yêu cầu kết nối. Sau khi coach chấp nhận, hai bên có thể chia sẻ giáo án, dữ liệu buổi tập và tiến độ. Quan hệ này có thể được kết thúc khi một trong hai bên không còn tiếp tục làm việc cùng nhau.' },
    ],
  },
  cta: {
    title: <>Lên kế hoạch rõ ràng.<br />Tập luyện có kỷ luật.</>,
    desc: "Tạo tài khoản miễn phí để bắt đầu, nâng cấp User's Plan khi cần nhiều dữ liệu hơn, hoặc dùng thử Coach nếu bạn đang quản lý học viên.",
    button: 'Tạo tài khoản ->',
  },
  footer: {
    tag: 'Nhật ký tập luyện dành cho người muốn tập có kế hoạch và cho coach muốn quản lý học viên bằng dữ liệu rõ ràng.',
    product: 'Sản phẩm',
    productLinks: ['Trình tạo kế hoạch', 'Ghi buổi tập', 'Thư viện bài tập', 'Theo dõi PR'],
    coaches: 'Coach',
    coachLinks: ['Dành cho coach', 'Bảng giá', 'Cách hoạt động'],
    company: 'Công ty',
    companyLinks: ['Giới thiệu', 'Đăng nhập', 'Bắt đầu'],
    copyright: '© 2026 Xenoh. Đã đăng ký mọi quyền.',
    madeFor: 'Dành cho những người nghiêm túc với từng buổi tập.',
  },
} as const

function useLandingCopy() {
  const lang = useLangStore((s) => s.lang)
  return lang === 'vi' ? polishedLandingCopyVi : landingCopy.en
}

// ─── Redirect logged-in users to dashboard ───────────────────────────────────
export function LandingPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (accessToken) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ background: 'var(--xn-paper)', minHeight: '100vh' }}>
      <MarketingNav />
      <Hero />
      <Stats />
      <LogoBar />
      <HowItWorks />
      <FeaturePlan />
      <FeatureCoach />
      <FeatureGrid />
      <Testimonial />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function MarketingNav() {
  const t = useLandingCopy()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`mk-nav${scrolled ? ' scrolled' : ''}`}>
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        <img src="/assets/logo-mark.svg" alt="Xenoh" />
        Xenoh
      </Link>
      <nav>
        <a href="#how">{t.nav.how}</a>
        <a href="#features">{t.nav.features}</a>
        <a href="#pricing">{t.nav.pricing}</a>
        <a href="#faq">{t.nav.faq}</a>
        <Link to="/about" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>{t.nav.about}</Link>
      </nav>
      <div className="cta">
        <LanguageSwitcher />
        <Link to="/login" className="mk-btn secondary">{t.nav.signIn}</Link>
        <Link to="/register" className="mk-btn clay">{t.nav.startFree}</Link>
      </div>
    </header>
  )
}

function Hero() {
  const t = useLandingCopy()
  return (
    <section className="mk-hero">
      <div className="inner">
        <div>
          <div className="eyebrow">{t.hero.eyebrow}</div>
          <h1>{t.hero.title}</h1>
          <p className="lede">{t.hero.lede}</p>
          <div className="actions">
            <Link to="/register" className="mk-btn primary lg">{t.hero.primary}</Link>
            <a href="#how" className="mk-btn secondary lg">{t.hero.secondary}</a>
          </div>
        </div>
        <div className="visual mk-intro-preview-shell">
          <div className="mk-intro-preview-pad">
            <div className="mk-app-preview mk-today-preview">
              <div className="bar">
                <div className="dots"><span /><span /><span /></div>
                xenoh.app / today
              </div>
              <div className="body mk-today-body">
                <div className="mk-preview-kicker">
                  {t.hero.today}
                </div>
                <div className="mk-preview-title">
                  {t.hero.workout}
                </div>
                <div className="mk-set-grid">
                  {[true, true, true, false, false].map((done, i) => (
                    <div key={i} className={`mk-set-cell${done ? ' done' : ''}`}>
                      {done ? '5x80' : '-'}
                    </div>
                  ))}
                </div>
                <div className="mk-preview-progress">
                  {t.hero.sets}
                </div>
                <div className="mk-next-exercise">
                  <div className="mk-next-exercise-head">
                    <div>{t.hero.overhead}</div>
                    <span>4x8 @ 40kg</span>
                  </div>
                  <div className="mk-next-set-row">
                    {[false, false, false, false].map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const t = useLandingCopy()
  return (
    <div className="mk-stats">
      {t.stats.map((s, i) => (
        <a key={i} href="#features" className="stat mk-card-link" aria-label={`${t.how.view} ${s.lbl}`}>
          <div className="lbl">{s.lbl}</div>
          <div className="num">{s.num}{s.suffix && <span>{s.suffix}</span>}</div>
          <div className="desc">{s.desc}</div>
        </a>
      ))}
    </div>
  )
}

function LogoBar() {
  const t = useLandingCopy()
  return (
    <div className="mk-logobar">
      <div className="k">{t.logoBar.label}</div>
      <div className="row">
        {t.logoBar.names.map((n) => <span key={n}>{n}</span>)}
      </div>
    </div>
  )
}

function HowItWorks() {
  const t = useLandingCopy()
  return (
    <section className="mk-section" id="how">
      <div className="mk-section-head">
        <div className="eyebrow">{t.how.eyebrow}</div>
        <h2>{t.how.title}</h2>
        <p>{t.how.desc}</p>
      </div>
      <div className="mk-steps">
        {t.how.steps.map((s) => (
          <a key={s.n} href="#features" className="mk-step mk-card-link" aria-label={`${s.h} ${t.how.view}`}>
            <div className="n">{s.n}</div>
            <h4>{s.h}</h4>
            <p>{s.p}</p>
            <div className="tag">{s.tag}</div>
          </a>
        ))}
      </div>
    </section>
  )
}

function FeaturePlan() {
  const t = useLandingCopy()
  return (
    <section className="mk-section" id="features">
      <div className="mk-feature">
        <div className="text">
          <div className="eyebrow">{t.plan.eyebrow}</div>
          <h2>{t.plan.title}</h2>
          <p>{t.plan.desc}</p>
          <ul>{t.plan.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="visual mk-week-preview">
          <div className="body mk-week-body">
            <div className="mk-week-strip">
              {t.plan.days.map((d, i) => {
                const isDone = i < 3
                const isToday = i === 3
                const isRest = i === 6
                return (
                  <div key={d} className={`mk-week-day${isDone ? ' done' : ''}${isToday ? ' today' : ''}${isRest ? ' rest' : ''}`}>
                    <div>{d}</div>
                    <strong>{14 + i}</strong>
                    <span>{t.plan.labels[i]}</span>
                  </div>
                )
              })}
            </div>
            {t.plan.exercises.map((ex) => (
              <div key={ex.name} className="mk-week-exercise">
                <strong>{ex.name}</strong>
                <span>{ex.sets}x{ex.reps} @ {ex.weight}kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCoach() {
  const t = useLandingCopy()
  return (
    <div className="mk-paper-alt">
      <div className="inner">
        <div className="mk-feature reverse">
          <div className="visual mk-coach-preview-shell">
            <div className="mk-app-preview mk-coach-preview">
              <div className="bar">
                <div className="dots"><span /><span /><span /></div>
                xenoh.app / coach / clients
              </div>
              <div className="body mk-coach-list">
                {t.coach.clients.map((c) => (
                  <div key={c.name} className="mk-coach-client">
                    <div className="mk-client-avatar">{c.init}</div>
                    <div>
                      <strong>{c.name}</strong>
                      <p>{c.plan}</p>
                    </div>
                    <span>{c.stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text">
            <div className="eyebrow">{t.coach.eyebrow}</div>
            <h2>{t.coach.title}</h2>
            <p>{t.coach.desc}</p>
            <ul>{t.coach.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureGrid() {
  const t = useLandingCopy()
  return (
    <section className="mk-section">
      <div className="mk-section-head">
        <div className="eyebrow">{t.grid.eyebrow}</div>
        <h2>{t.grid.title}</h2>
        <p>{t.grid.desc}</p>
      </div>
      <div className="mk-grid6">
        {t.grid.cells.map((c) => (
          <a key={c.h} href="#pricing" className="cell mk-card-link" aria-label={`${c.h}. ${t.grid.view}`}>
            <div className="ico">{c.ico}</div>
            <h5>{c.h}</h5>
            <p>{c.p}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

function Testimonial() {
  const t = useLandingCopy()
  return (
    <section className="mk-section">
      <div className="mk-quote">
        <blockquote>{t.testimonial.quote}</blockquote>
        <div className="who"><b>Elena Arroyo</b> - {t.testimonial.who}</div>
      </div>
    </section>
  )
}

function Pricing() {
  const t = useLandingCopy()
  return (
    <section className="mk-section" id="pricing">
      <div className="mk-section-head">
        <div className="eyebrow">{t.pricing.eyebrow}</div>
        <h2>{t.pricing.title}</h2>
        <p>{t.pricing.desc}</p>
      </div>
      <div className="mk-pricing">
        <Link to="/register" className="mk-price mk-card-link" aria-label={t.pricing.soloAria}>
          <div><div className="tier">{t.pricing.soloTier}</div><h3>{t.pricing.soloName}</h3></div>
          <div className="amount">{t.pricing.soloPrice}<span>{t.pricing.soloUnit}</span></div>
          <p>{t.pricing.soloDesc}</p>
          <ul>{t.pricing.soloFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
          <span className="mk-btn secondary lg">{t.pricing.soloButton}</span>
        </Link>
        <Link to="/register" className="mk-price highlighted mk-card-link" aria-label={t.pricing.userAria}>
          <div><div className="tier">{t.pricing.userTier}</div><h3>{t.pricing.userName}</h3></div>
          <div className="amount">{t.pricing.userPrice}<span>{t.pricing.userUnit}</span></div>
          <p>{t.pricing.userDesc}</p>
          <ul>{t.pricing.userFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
          <span className="mk-btn secondary lg">{t.pricing.userButton}</span>
        </Link>
        <Link to="/register" className="mk-price featured mk-card-link" aria-label={t.pricing.coachAria}>
          <div><div className="tier">{t.pricing.coachTier}</div><h3>{t.pricing.coachName}</h3></div>
          <div className="amount">{t.pricing.coachPrice}<span>{t.pricing.coachUnit}</span></div>
          <p>{t.pricing.coachDesc}</p>
          <ul>{t.pricing.coachFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
          <span className="mk-btn on-dark lg">{t.pricing.coachButton}</span>
        </Link>
      </div>
    </section>
  )
}

function FAQ() {
  const t = useLandingCopy()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="mk-section" id="faq">
      <div className="mk-section-head">
        <div className="eyebrow">{t.faq.eyebrow}</div>
        <h2>{t.faq.title}</h2>
      </div>
      <div className="mk-faq">
        {t.faq.qs.map((q, i) => {
          const isOpen = openIndex === i

          return (
            <div key={q.q} className={`q mk-faq-item${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="mk-faq-trigger"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span>{q.q}</span>
                <span className="mk-faq-icon" aria-hidden="true">{isOpen ? '-' : '+'}</span>
              </button>
              <div id={`faq-answer-${i}`} className="mk-faq-answer" hidden={!isOpen}>
                <p>{q.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FinalCTA() {
  const t = useLandingCopy()
  return (
    <section className="mk-cta">
      <h2>{t.cta.title}</h2>
      <p>{t.cta.desc}</p>
      <Link to="/register" className="mk-btn on-dark lg" style={{ position: 'relative' }}>
        {t.cta.button}
      </Link>
    </section>
  )
}

function Footer() {
  const t = useLandingCopy()
  return (
    <footer className="mk-footer">
      <div className="inner">
        <div>
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <img src="/assets/logo-mark.svg" alt="" />
            Xenoh
          </Link>
          <div className="tag">{t.footer.tag}</div>
        </div>
        <div>
          <h6>{t.footer.product}</h6>
          <ul>
            {t.footer.productLinks.map((label) => <li key={label}><a href="#features">{label}</a></li>)}
          </ul>
        </div>
        <div>
          <h6>{t.footer.coaches}</h6>
          <ul>
            <li><a href="#pricing">{t.footer.coachLinks[0]}</a></li>
            <li><a href="#pricing">{t.footer.coachLinks[1]}</a></li>
            <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.coachLinks[2]}</Link></li>
          </ul>
        </div>
        <div>
          <h6>{t.footer.company}</h6>
          <ul>
            <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.companyLinks[0]}</Link></li>
            <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.companyLinks[1]}</Link></li>
            <li><Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.companyLinks[2]}</Link></li>
          </ul>
        </div>
      </div>
      <div className="small">
        <div>{t.footer.copyright}</div>
        <div>{t.footer.madeFor}</div>
      </div>
    </footer>
  )
}
