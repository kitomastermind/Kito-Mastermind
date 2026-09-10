import Link from 'next/link';
import { SiteNav } from '@/components/marketing/SiteNav';
import { Reveal } from '@/components/marketing/Reveal';
import { BrandMark } from '@/components/brand/BrandMark';
import { BRAND } from '@/lib/brand';

const STEPS = [
  { n: '01', title: 'Enter the circle', body: 'Invitation-only chapters. You sit with people who actually ship work.' },
  { n: '02', title: 'Log the work', body: 'Leads, promises, and lessons stay in one operational room — not a group chat.' },
  { n: '03', title: 'Match without leak', body: 'Client names stay locked until the owner grants access. Role never overrides that.' },
  { n: '04', title: 'Keep the score', body: 'Partners verify actions. Points and dues stay visible. The circle holds itself.' },
] as const;

const RIBBONS = [
  {
    index: '01',
    title: 'A table, not a feed.',
    body: 'KITO is the chapter room: leads, accountability, and the monthly lesson — dense enough to run a week from your phone.',
    image: BRAND.photos.hero,
    alt: 'Chapter members working together around a table',
  },
  {
    index: '02',
    title: 'Access is granted, never implied.',
    body: 'Another member’s client stays hidden until they approve the request. Screenshots are not a loophole. The grant is the record.',
    image: BRAND.photos.handshake,
    alt: 'Handshake closing a professional introduction',
  },
  {
    index: '03',
    title: 'Dues and promises, in the same ledger.',
    body: 'M-Pesa statements, partner verification, and cycle points sit next to the work — so the chapter can see who is keeping pace.',
    image: BRAND.photos.phone,
    alt: 'Mobile money payment in a local commerce setting',
  },
] as const;

export default function Home() {
  const year = new Date().getFullYear();
  return (
    <div className="kito-site">
      <SiteNav overlay />
      <section className="mk-hero">
        <div
          className="mk-hero__media"
          style={{ backgroundImage: `url('${BRAND.photos.hero}')` }}
          aria-hidden
        />
        <div className="mk-hero__shade" aria-hidden />
        <div className="mk-hero__grain" aria-hidden />
        <div className="container mk-hero__inner">
          <p className="mk-brand">{BRAND.product}</p>
          <div className="mk-hero__rule" />
          <h1>Keep the circle accountable.</h1>
          <p className="mk-hero__sub">{BRAND.promise}</p>
          <div className="jump">
            <Link href="/login" className="btn btn-lime">
              Enter chapter
              <span className="node" aria-hidden>
                →
              </span>
            </Link>
            <a href="#how" className="btn btn-ghost-light">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="mk-problem" id="circle">
        <div className="container mk-problem__grid">
          <Reveal>
            <p className="label dark">The problem</p>
            <h2 className="mt-4 font-marketing text-4xl font-bold tracking-tight">
              Production chapters die in inboxes.
            </h2>
            <p className="mt-4 max-w-[42ch] text-[#5A6B60]">
              Leads leak. Promises evaporate. Client numbers get forwarded. KITO is the locked room where the
              chapter can work without that drift.
            </p>
          </Reveal>
          <Reveal delay={2}>
            <aside>
              <p className="label dark">What stays private</p>
              <p className="mt-3 text-lg font-medium text-[#0E1F1A]">
                Name, phone, email, and notes belong to the member who logged the lead. Access is per lead,
                revocable, and never implied by role.
              </p>
            </aside>
          </Reveal>
        </div>
        <p className="mk-problem__big" aria-hidden>
          KITO
        </p>
      </section>

      <section className="mk-flow" id="how">
        <div className="container">
          <Reveal>
            <p className="label">How it works</p>
            <h2 className="mt-3 mb-10 font-marketing text-4xl font-bold">Four moves. One circle.</h2>
          </Reveal>
          <div className="mk-rail">
            {STEPS.map((step, index) => (
              <Reveal key={step.n} delay={(index + 1) as 1 | 2 | 3 | 4} className="mk-step">
                <div className="mk-step__disc">{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {RIBBONS.map((row) => (
        <article key={row.index} className="mk-ribbon">
          <div className="mk-ribbon__copy">
            <Reveal>
              <p className="mk-ribbon__index">{row.index}</p>
              <h2 className="mt-3 font-marketing text-3xl font-bold">{row.title}</h2>
              <p className="mt-3 max-w-[40ch] text-[#5A6B60]">{row.body}</p>
            </Reveal>
          </div>
          <div className="mk-ribbon__media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.image} alt={row.alt} />
          </div>
        </article>
      ))}

      <div className="mk-slash" />

      <section className="mk-statement">
        <div className="container">
          <Reveal>
            <p>
              The chapter is the product. <span className="lime">The lock is the promise.</span>
            </p>
          </Reveal>
          <div className="mk-metrics">
            <div>
              <p className="text-3xl font-extrabold">Invite only</p>
              <p className="mt-2 text-sm text-white/65">No public signup. A lead sends the link.</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">Per-lead grants</p>
              <p className="mt-2 text-sm text-white/65">PII stays sealed until the owner says yes.</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">Partner verify</p>
              <p className="mt-2 text-sm text-white/65">Actions count when someone else signs them.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container relative z-10">
          <Reveal>
            <p className="label dark">Ready</p>
            <h2 className="mt-3 max-w-[14ch] font-marketing text-4xl font-bold text-[#0E1F1A]">
              Sit down. Keep the week.
            </h2>
            <div className="mt-8">
              <Link href="/login" className="btn btn-dark">
                Enter chapter
                <span className="node" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="flex items-center gap-3">
                <BrandMark className="h-10 w-10" />
                <strong className="font-marketing text-xl">{BRAND.product}</strong>
              </div>
              <p className="mt-4 max-w-[32ch] text-sm text-white/70">{BRAND.tagline}</p>
            </div>
            <div>
              <h4>Circle</h4>
              <Link href="/#how">How it works</Link>
              <Link href="/agreement">Member agreement</Link>
            </div>
            <div>
              <h4>Chapter</h4>
              <Link href="/login">Sign in</Link>
              <Link href="/forgot-password">Reset password</Link>
            </div>
            <div>
              <h4>Honesty</h4>
              <p className="mt-3 text-sm text-white/70">
                Membership is by invitation. Client details are never a chapter asset.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {year} {BRAND.product}</span>
            <span>Invitation only · Nairobi chapters</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
