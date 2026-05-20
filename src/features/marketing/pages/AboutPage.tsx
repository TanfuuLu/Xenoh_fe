import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuthStore } from '@/features/auth'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { useLangStore } from '@/shared/i18n'
import '@/styles/marketing.css'

const aboutCopy = {
  en: {
    nav: {
      home: 'Home',
      how: 'How it works',
      pricing: 'Pricing',
      faq: 'FAQ',
      signIn: 'Sign in',
      startFree: 'Start free ->',
      goToApp: 'Go to app ->',
    },
    hero: {
      eyebrow: 'About Xenoh',
      title: <>Built for the bar.<br />Not for the app.</>,
      body: 'Xenoh started as a simple training problem: plans lived in spreadsheets, sessions lived in notes apps, and coaches had to reconstruct the truth from screenshots and messages. We built one shared training journal so the plan, the session log, and the progress history stay together.',
    },
    story: {
      problemEyebrow: 'The problem',
      problemTitle: 'The plan and the log were never in the same place.',
      problemBody: [
        'Most serious coaches already had a system. A sheet for the program, a chat thread for check-ins, and a separate app where clients logged numbers. Each tool solved one piece, but none of them gave both sides the same view.',
        'That gap is where context gets lost. The coach writes one thing, the client does another, and progress becomes harder to understand than it needs to be.',
      ],
      fixEyebrow: 'The fix',
      fixTitle: 'One journal. Two views. Shared context.',
      fixBody: [
        "A coach writes a plan and it appears in the client's app immediately, formatted for training on a phone. The client logs sets during the session, and the coach sees the result without chasing screenshots.",
        'The journal belongs to the training relationship. Each side sees what they need, and both sides trust the same record.',
      ],
    },
    beliefs: {
      eyebrow: 'What we believe',
      title: "Principles we don't argue about.",
      items: [
        { n: '01', h: 'Precision beats memory.', p: 'Reps, weight, RPE, and completion history matter. Training decisions are better when the numbers are easy to find.' },
        { n: '02', h: 'The coach-client workflow is the product.', p: 'Plans, logs, comments, and progress should live together instead of being scattered across different tools.' },
        { n: '03', h: 'Fast enough to use between sets.', p: 'If logging feels slow, people stop logging. Xenoh keeps the session view focused and quick.' },
        { n: '04', h: 'Your data is yours.', p: 'Training history should be portable. Plans and logs can be exported when you need them.' },
        { n: '05', h: 'Calm tools work better.', p: 'The gym is already loud. The app should feel clear, warm, and steady.' },
        { n: '06', h: 'No dark patterns.', p: 'No guilt loops, fake urgency, or noisy streak mechanics. Training is already meaningful enough.' },
      ],
    },
    deepDive: {
      eyebrow: 'How it connects',
      title: 'The system behind the journal.',
      items: [
        {
          title: 'Plans',
          desc: 'A plan is a training period with weeks, daily workouts, exercises, and target sets. It can be self-authored or assigned by a coach.',
          detail: 'When a coach owns the plan, the client can log and complete work while the coach manages the structure.',
        },
        {
          title: 'Coach-client relationship',
          desc: 'A client sends a request, the coach accepts, and both sides get a shared workspace for plans and progress.',
          detail: 'Either side can end the relationship without affecting the client’s own personal plans.',
        },
        {
          title: 'Session logging',
          desc: 'Open today’s workout, enter actual reps and weight, then mark each set done. The UI stays fast because it is designed for use mid-session.',
          detail: 'The goal is simple: less time fighting the app, more attention on the next set.',
        },
        {
          title: 'Progress',
          desc: 'Completed sets feed into PRs, compliance, bodyweight trends, and coach dashboard summaries.',
          detail: 'Progress is easier to discuss when both sides are looking at the same data.',
        },
      ],
    },
    cta: {
      title: 'Ready to start?',
      desc: "Start free, upgrade with User's Plan, or try Coach for 30 days. No credit card required.",
      button: 'Create your account ->',
    },
    footer: {
      tag: 'A training journal for people who are serious about the plan, and for the coaches who write them.',
      product: 'Product',
      productLinks: ['Features', 'How it works', 'Pricing'],
      company: 'Company',
      companyLinks: ['About', 'Sign in', 'Get started'],
      legal: 'Legal',
      legalLinks: ['Privacy', 'Terms'],
      copyright: '© 2026 Xenoh. All rights reserved.',
      madeFor: 'Made for people who show up.',
    },
  },
  vi: {
    nav: {
      home: 'Trang chủ',
      how: 'Cách hoạt động',
      pricing: 'Bảng giá',
      faq: 'FAQ',
      signIn: 'Đăng nhập',
      startFree: 'Bắt đầu miễn phí ->',
      goToApp: 'Vào ứng dụng ->',
    },
    hero: {
      eyebrow: 'Về Xenoh',
      title: <>Sinh ra cho buổi tập.<br />Không phải để làm bạn bận thêm.</>,
      body: 'Xenoh bắt đầu từ một vấn đề rất quen thuộc trong tập luyện: giáo án nằm trong spreadsheet, log buổi tập nằm trong app ghi chú, còn coach phải ghép lại toàn bộ câu chuyện từ tin nhắn và ảnh chụp màn hình. Chúng tôi xây Xenoh như một nhật ký tập luyện chung, nơi kế hoạch, dữ liệu buổi tập và tiến độ được giữ cùng một chỗ.',
    },
    story: {
      problemEyebrow: 'Vấn đề',
      problemTitle: 'Kế hoạch và dữ liệu thực tế thường không nằm cùng một nơi.',
      problemBody: [
        'Một coach nghiêm túc thường đã có quy trình riêng: spreadsheet để viết giáo án, nhóm chat để trao đổi, và một công cụ khác để học viên ghi số liệu. Mỗi thứ giải quyết một phần, nhưng không thứ nào cho cả hai bên cùng một bức tranh đầy đủ.',
        'Khoảng trống đó làm mất ngữ cảnh. Coach viết một kế hoạch, học viên thực hiện theo thực tế của buổi tập, nhưng dữ liệu lại bị rời rạc. Việc đánh giá tiến độ vì thế trở nên khó hơn mức cần thiết.',
      ],
      fixEyebrow: 'Cách Xenoh giải quyết',
      fixTitle: 'Một nhật ký chung. Hai góc nhìn. Cùng một dữ liệu.',
      fixBody: [
        'Coach viết giáo án và kế hoạch xuất hiện ngay trong tài khoản của học viên, được trình bày phù hợp để dùng trên điện thoại tại phòng gym. Học viên ghi từng hiệp trong lúc tập, còn coach theo dõi kết quả mà không cần hỏi lại ảnh chụp hay tin nhắn.',
        'Nhật ký này phục vụ cho mối quan hệ tập luyện. Mỗi bên nhìn thấy phần mình cần, nhưng cả hai cùng tin vào một nguồn dữ liệu duy nhất.',
      ],
    },
    beliefs: {
      eyebrow: 'Điều chúng tôi tin',
      title: 'Những nguyên tắc không cần tranh luận.',
      items: [
        { n: '01', h: 'Dữ liệu rõ ràng tốt hơn trí nhớ.', p: 'Reps, mức tạ, RPE và lịch sử hoàn thành đều quan trọng. Quyết định tập luyện sẽ tốt hơn khi số liệu dễ tìm và dễ hiểu.' },
        { n: '02', h: 'Luồng làm việc giữa coach và học viên là trọng tâm.', p: 'Giáo án, log buổi tập, ghi chú và tiến độ nên nằm cùng nhau thay vì bị chia nhỏ ở nhiều công cụ.' },
        { n: '03', h: 'Đủ nhanh để dùng giữa các hiệp.', p: 'Nếu việc ghi dữ liệu mất thời gian, người tập sẽ bỏ qua. Xenoh giữ màn hình buổi tập gọn, rõ và thao tác nhanh.' },
        { n: '04', h: 'Dữ liệu thuộc về bạn.', p: 'Lịch sử tập luyện nên có thể mang đi. Kế hoạch và log tập có thể xuất ra khi bạn cần.' },
        { n: '05', h: 'Công cụ bình tĩnh giúp tập tốt hơn.', p: 'Phòng gym đã đủ ồn và nhiều kích thích. Ứng dụng nên rõ ràng, ấm áp và ổn định.' },
        { n: '06', h: 'Không dùng dark pattern.', p: 'Không tạo cảm giác tội lỗi, không ép streak giả tạo, không biến tập luyện thành một vòng thông báo ồn ào.' },
      ],
    },
    deepDive: {
      eyebrow: 'Cách hệ thống kết nối',
      title: 'Phía sau một nhật ký tập luyện chung.',
      items: [
        {
          title: 'Kế hoạch',
          desc: 'Một kế hoạch là một giai đoạn tập luyện gồm nhiều tuần, các buổi tập theo ngày, bài tập và mục tiêu từng hiệp. Kế hoạch có thể do bạn tự tạo hoặc do coach giao.',
          detail: 'Khi kế hoạch thuộc về coach, học viên tập và ghi log, còn coach quản lý cấu trúc giáo án.',
        },
        {
          title: 'Quan hệ coach-học viên',
          desc: 'Học viên gửi yêu cầu kết nối, coach chấp nhận, và cả hai có một không gian chung để làm việc với giáo án và tiến độ.',
          detail: 'Hai bên có thể kết thúc kết nối mà không ảnh hưởng đến các kế hoạch cá nhân do học viên tự tạo.',
        },
        {
          title: 'Ghi buổi tập',
          desc: 'Mở buổi tập hôm nay, nhập reps và mức tạ thực tế, rồi đánh dấu từng hiệp đã hoàn thành. Giao diện được thiết kế để dùng nhanh trong lúc tập.',
          detail: 'Mục tiêu rất đơn giản: ít thời gian thao tác hơn, nhiều sự tập trung hơn cho hiệp tiếp theo.',
        },
        {
          title: 'Theo dõi tiến độ',
          desc: 'Các hiệp đã hoàn thành được dùng để cập nhật PR, mức hoàn thành kế hoạch, xu hướng cân nặng và dashboard cho coach.',
          detail: 'Việc trao đổi tiến độ dễ hơn khi cả hai bên đang nhìn vào cùng một dữ liệu.',
        },
      ],
    },
    cta: {
      title: 'Sẵn sàng bắt đầu?',
      desc: "Bắt đầu miễn phí, nâng cấp User's Plan khi cần nhiều dữ liệu hơn, hoặc dùng thử Coach trong 30 ngày. Không cần thẻ tín dụng.",
      button: 'Tạo tài khoản ->',
    },
    footer: {
      tag: 'Nhật ký tập luyện cho người nghiêm túc với kế hoạch, và cho coach viết ra những kế hoạch đó.',
      product: 'Sản phẩm',
      productLinks: ['Tính năng', 'Cách hoạt động', 'Bảng giá'],
      company: 'Công ty',
      companyLinks: ['Giới thiệu', 'Đăng nhập', 'Bắt đầu'],
      legal: 'Pháp lý',
      legalLinks: ['Quyền riêng tư', 'Điều khoản'],
      copyright: '© 2026 Xenoh. Đã đăng ký mọi quyền.',
      madeFor: 'Dành cho những người nghiêm túc với từng buổi tập.',
    },
  },
} as const

export function AboutPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const lang = useLangStore((s) => s.lang)
  const t = aboutCopy[lang]

  return (
    <div style={{ background: 'var(--xn-paper)', minHeight: '100vh' }}>
      <header className="mk-nav scrolled">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <img src="/assets/logo-mark.svg" alt="Xenoh" />
          Xenoh
        </Link>
        <nav>
          <Link to="/" style={navLink}>{t.nav.home}</Link>
          <a href="/#how">{t.nav.how}</a>
          <a href="/#pricing">{t.nav.pricing}</a>
          <a href="/#faq">{t.nav.faq}</a>
        </nav>
        <div className="cta">
          <LanguageSwitcher />
          {accessToken ? (
            <Link to="/dashboard" className="mk-btn clay">{t.nav.goToApp}</Link>
          ) : (
            <>
              <Link to="/login" className="mk-btn secondary">{t.nav.signIn}</Link>
              <Link to="/register" className="mk-btn clay">{t.nav.startFree}</Link>
            </>
          )}
        </div>
      </header>

      <section className="mk-about-hero">
        <div className="mk-about-hero-inner">
          <Eyebrow>{t.hero.eyebrow}</Eyebrow>
          <h1>{t.hero.title}</h1>
          <p>{t.hero.body}</p>
        </div>
      </section>

      <section className="mk-about-section">
        <div className="mk-about-two-col">
          <div>
            <Eyebrow>{t.story.problemEyebrow}</Eyebrow>
            <h2 style={heading2}>{t.story.problemTitle}</h2>
            {t.story.problemBody.map((paragraph) => <p key={paragraph} style={bodyText}>{paragraph}</p>)}
          </div>
          <div>
            <Eyebrow>{t.story.fixEyebrow}</Eyebrow>
            <h2 style={heading2}>{t.story.fixTitle}</h2>
            {t.story.fixBody.map((paragraph) => <p key={paragraph} style={bodyText}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      <section className="mk-about-band">
        <div className="mk-about-wide">
          <div className="mk-about-head">
            <Eyebrow>{t.beliefs.eyebrow}</Eyebrow>
            <h2 style={{ ...heading2, textAlign: 'center', fontSize: 44, maxWidth: 620, margin: '0 auto' }}>
              {t.beliefs.title}
            </h2>
          </div>
          <div className="mk-about-grid">
            {t.beliefs.items.map((item) => (
              <a key={item.n} href="/#features" className="mk-card-link mk-about-card">
                <div className="mk-about-card-num">{item.n}</div>
                <h4>{item.h}</h4>
                <p>{item.p}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-about-section">
        <div className="mk-about-head">
          <Eyebrow>{t.deepDive.eyebrow}</Eyebrow>
          <h2 style={{ ...heading2, textAlign: 'center' }}>{t.deepDive.title}</h2>
        </div>
        <div className="mk-about-list">
          {t.deepDive.items.map((item) => (
            <a key={item.title} href="/#features" className="mk-card-link mk-about-row">
              <h3>{item.title}</h3>
              <div>
                <p>{item.desc}</p>
                <small>{item.detail}</small>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="mk-cta">
        <h2>{t.cta.title}</h2>
        <p>{t.cta.desc}</p>
        <Link to="/register" className="mk-btn on-dark lg" style={{ position: 'relative' }}>
          {t.cta.button}
        </Link>
      </section>

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
              <li><a href="/#features">{t.footer.productLinks[0]}</a></li>
              <li><a href="/#how">{t.footer.productLinks[1]}</a></li>
              <li><a href="/#pricing">{t.footer.productLinks[2]}</a></li>
            </ul>
          </div>
          <div>
            <h6>{t.footer.company}</h6>
            <ul>
              <li><Link to="/about" style={footerLink}>{t.footer.companyLinks[0]}</Link></li>
              <li><Link to="/login" style={footerLink}>{t.footer.companyLinks[1]}</Link></li>
              <li><Link to="/register" style={footerLink}>{t.footer.companyLinks[2]}</Link></li>
            </ul>
          </div>
          <div>
            <h6>{t.footer.legal}</h6>
            <ul>
              <li><a href="#">{t.footer.legalLinks[0]}</a></li>
              <li><a href="#">{t.footer.legalLinks[1]}</a></li>
            </ul>
          </div>
        </div>
        <div className="small">
          <div>{t.footer.copyright}</div>
          <div>{t.footer.madeFor}</div>
        </div>
      </footer>
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="mk-about-eyebrow">{children}</div>
}

const navLink: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  fontWeight: 500,
  fontSize: 14,
}

const footerLink: CSSProperties = {
  color: 'inherit',
  textDecoration: 'none',
}

const heading2: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: 36,
  lineHeight: 1.08,
  letterSpacing: '-0.02em',
  color: 'var(--fg-1)',
  margin: '0 0 18px',
}

const bodyText: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 16,
  lineHeight: 1.75,
  color: 'var(--fg-2)',
  margin: '0 0 14px',
}
