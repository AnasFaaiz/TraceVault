import Link from 'next/link';
import { Terminal, ArrowRight, GitBranch, Layers, TrendingUp } from 'lucide-react';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landingRoot}>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <span className={styles.iconBox}><Terminal size={14} /></span>
          TraceVault
        </Link>
        <div className={styles.navLinks}>
          <Link href="/docs" className={styles.navLink}>How it works</Link>
          <Link href="/examples" className={styles.navLink}>Examples</Link>
          <Link href="/login" className={styles.navLink}>Login</Link>
          <Link href="/register" className={styles.navCta}>Get started →</Link>
        </div>
      </nav>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Engineering reflection platform
            </div>
            <h1 className={styles.heroHeadline}>
              Document the <em>thinking</em>,<br />not just the code.
            </h1>
            <p className={styles.heroSub}>
              A structured vault for serious engineers. Record your design decisions,
              architectural tradeoffs, and lessons learned — and watch your thinking evolve over time.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register" className={styles.btnPrimary}>
                Start your vault <ArrowRight size={14} />
              </Link>
              <Link href="/docs" className={styles.btnGhost}>See a sample reflection</Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.cardStack}>
              <div className={`${styles.cardGhost} ${styles.cardGhost2}`} />
              <div className={`${styles.cardGhost} ${styles.cardGhost1}`} />
              <div className={styles.reflectionCard}>
                <div className={styles.rcHeader}>
                  <span className={styles.rcProject}><strong>distributed-cache</strong> / v2 rewrite</span>
                  <span className={styles.rcPhase}>Core build</span>
                </div>
                <div className={styles.rcBody}>
                  <div className={styles.rcEntry}>
                    <span className={`${styles.rcEntryTag} ${styles.tagChallenge}`}>Challenge</span>
                    <p className={styles.rcEntryText}>Consistent hashing collapsed under rebalancing load — key migration created a <strong>cascading invalidation storm</strong> across all replicas.</p>
                  </div>
                  <div className={styles.rcEntry}>
                    <span className={`${styles.rcEntryTag} ${styles.tagDecision}`}>Decision</span>
                    <p className={styles.rcEntryText}>Chose <strong>virtual nodes</strong> over range-based partitioning. More even distribution, at the cost of membership protocol complexity.</p>
                  </div>
                  <div className={styles.rcEntry}>
                    <span className={`${styles.rcEntryTag} ${styles.tagTradeoff}`}>Tradeoff</span>
                    <p className={styles.rcEntryText}>Eventual consistency with read-repair. Acceptable for our access patterns — rules out transactional use cases entirely.</p>
                  </div>
                  <div className={styles.rcEntry}>
                    <span className={`${styles.rcEntryTag} ${styles.tagLesson}`}>Lesson</span>
                    <p className={styles.rcEntryText}><strong>Map failure paths before happy paths.</strong> We&apos;d have caught the storm in design, not production.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className={styles.sectionDivider}>
          <span className={styles.dividerLine} />
          <span>What you get</span>
          <span className={styles.dividerLine} />
        </div>

        {/* Features */}
        <section className={styles.features}>
          <div className={styles.featuresIntro}>
            <div>
              <p className={styles.sectionLabel}>The platform</p>
              <h2 className={styles.sectionHeading}>
                Your engineering mind,<br /><em>structured.</em>
              </h2>
            </div>
            <p className={styles.sectionBody}>
              Most portfolios show what you built. TraceVault shows how you think —
              the real differentiator in senior engineering interviews, design reviews,
              and your own learning arc.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCell}>
              <div className={`${styles.featureIcon} ${styles.amberBg}`}><GitBranch size={18} /></div>
              <h3 className={styles.featureTitle}>Design decisions</h3>
              <p className={styles.featureDesc}>Log the &quot;why&quot; behind every architectural choice. Your future self — and your teammates — will thank you.</p>
            </div>
            <div className={styles.featureCell}>
              <div className={`${styles.featureIcon} ${styles.tealBg}`}><Layers size={18} /></div>
              <h3 className={styles.featureTitle}>Archived tradeoffs</h3>
              <p className={styles.featureDesc}>Every real project is a series of compromises. Document them with context, not just conclusions.</p>
            </div>
            <div className={styles.featureCell}>
              <div className={`${styles.featureIcon} ${styles.rustBg}`}><TrendingUp size={18} /></div>
              <h3 className={styles.featureTitle}>Growth record</h3>
              <p className={styles.featureDesc}>A chronological view of how your problem-solving evolves. The most honest measure of engineering maturity.</p>
            </div>
          </div>
        </section>

        {/* Pull quote */}
        <div className={styles.quoteSection}>
          <div className={styles.quoteInner}>
            <span className={styles.quoteMark}>&quot;</span>
            <p className={styles.quoteText}>
              Senior engineers aren&apos;t hired for their code. They&apos;re hired for the
              quality of their thinking when the problem is unclear.
            </p>
            <p className={styles.quoteAttr}>— The premise behind TraceVault</p>
          </div>
        </div>

        {/* CTA */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaHeading}>
            Start building your<br /><em>engineering legacy</em><br />today.
          </h2>
          <div className={styles.ctaRight}>
            <Link href="/register" className={styles.btnPrimary} style={{ justifyContent: 'center' }}>
              Create your vault <ArrowRight size={14} />
            </Link>
            <p className={styles.ctaNote}>Free to start. No credit card.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>TraceVault</span>
        <span className={styles.footerCopy}>© 2026 — Engineered for the curious.</span>
      </footer>
    </div>
  );
}
