import Link from "next/link";

import { LocaleSwitcher } from "@/components/navigation/LocaleSwitcher";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import type { Locale, SiteCopy } from "@/i18n/site-copy";

type NoxaLandingProps = {
  locale: Locale;
  copy: SiteCopy;
};

export function NoxaLanding({ locale, copy }: NoxaLandingProps) {
  return (
    <main className="siteRoot">
      <header className="siteHeader">
        <div className="shell headerInner">
          <a className="wordmark" href="#top" aria-label={copy.homeLabel}>
            NOXA
          </a>

          <nav className="desktopNav" aria-label={copy.navigationLabel}>
            <a href="#product">{copy.nav.product}</a>
            <a href="#how">{copy.nav.how}</a>
            <a href="#community">{copy.nav.community}</a>
            <a href="#business">{copy.nav.business}</a>
          </nav>

          <div className="headerActions">
            <LocaleSwitcher locale={locale} label={copy.languageSelector} />
            <a className="headerCta" href="#waitlist">
              {copy.cta}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </header>

      <section id="top" className="heroSection">
        <div className="heroGlow" aria-hidden="true" />
        <div className="shell heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1>
              <span>{copy.hero.lineOne}</span>
              <span className="mutedHeadline">{copy.hero.lineTwo}</span>
            </h1>
            <p className="heroBody">{copy.hero.body}</p>

            <div className="heroActions">
              <a className="primaryButton" href="#waitlist">
                {copy.hero.primary}
                <span aria-hidden="true">↗</span>
              </a>
              <a className="secondaryButton" href="#product">
                {copy.hero.secondary}
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div
              className="statusLine"
              aria-label={`${copy.hero.status}. ${copy.hero.tested}`}
            >
              <span className="statusDot" aria-hidden="true" />
              <strong>{copy.hero.status}</strong>
              <span>{copy.hero.tested}</span>
            </div>
          </div>

          <div
            className="heroVisual"
            role="img"
            aria-label={copy.conceptPreviewLabel}
          >
            <div className="visualPresentation" aria-hidden="true">
              <div className="signalCard signalLeft">
                <span>{copy.map.nearby}</span>
                <strong>18 {copy.map.drivers}</strong>
              </div>
              <div className="signalCard signalRight">
                <span>{copy.map.tonight}</span>
                <strong>6 {copy.map.meets}</strong>
              </div>

              <div className="phoneShell">
                <div className="phoneScreen">
                  <div className="phoneTop">
                    <span>9:41</span>
                    <span className="dynamicIsland" />
                    <span>5G · 92%</span>
                  </div>
                  <div className="mapTopBar">
                    <strong>NOXA</strong>
                    <span>{copy.map.live}</span>
                  </div>
                  <div className="mapCanvas">
                    <span className="road roadOne" />
                    <span className="road roadTwo" />
                    <span className="road roadThree" />
                    <span className="routeLine" />
                    <span className="driverPin pinOne">S</span>
                    <span className="driverPin pinTwo">N</span>
                    <span className="driverPin pinThree">K</span>
                    <span className="meetPin">
                      <i />12
                    </span>
                  </div>
                  <div className="meetCard">
                    <div className="meetMeta">
                      <span>{copy.map.tonight}</span>
                      <span>21:30</span>
                    </div>
                    <strong>{copy.map.meetName}</strong>
                    <p>{copy.map.location}</p>
                    <div className="meetFooter">
                      <span>{copy.map.going}</span>
                      <span className="routeAction">{copy.map.route} →</span>
                    </div>
                  </div>
                  <div className="phoneNav">
                    <span className="selected">●</span>
                    <span>◇</span>
                    <span>＋</span>
                    <span>◌</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shell capabilityRail" aria-label={copy.capabilitiesLabel}>
          {copy.features.map((feature) => (
            <span key={feature.number}>{feature.title}</span>
          ))}
        </div>
      </section>

      <section id="product" className="section productSection">
        <div className="shell">
          <div className="sectionIntro">
            <p className="eyebrow">{copy.featureIntro.eyebrow}</p>
            <h2>{copy.featureIntro.title}</h2>
            <p>{copy.featureIntro.body}</p>
          </div>

          <div className="featureGrid">
            {copy.features.map((feature, index) => (
              <article
                className={`featureCard featureCard${index + 1}`}
                key={feature.number}
              >
                <div className="featureCardTop">
                  <span>{feature.number}</span>
                  <span>{feature.meta}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
                <div className="featureArt" aria-hidden="true">
                  <span className="artLine" />
                  <span className="artDot dotA" />
                  <span className="artDot dotB" />
                  <span className="artDot dotC" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="section howSection">
        <div className="shell">
          <div className="sectionIntro compactIntro">
            <p className="eyebrow">{copy.how.eyebrow}</p>
            <h2>{copy.how.title}</h2>
          </div>

          <div className="stepGrid">
            {copy.how.steps.map((step) => (
              <article className="stepCard" key={step.number}>
                <span className="stepNumber">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="community" className="section communitySection">
        <div className="shell communityPanel">
          <div className="communityCopy">
            <p className="eyebrow">{copy.community.eyebrow}</p>
            <h2>{copy.community.title}</h2>
            <p>{copy.community.body}</p>
          </div>
          <div className="communityVisual" aria-hidden="true">
            <span className="communityRoad roadA" />
            <span className="communityRoad roadB" />
            <span className="communityNode nodeA" />
            <span className="communityNode nodeB" />
            <span className="communityNode nodeC" />
          </div>
          <div className="communityPoints">
            {copy.community.points.map((point, index) => (
              <span key={point}>
                <b>0{index + 1}</b>
                {point}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="business" className="section businessSection">
        <div className="shell businessPanel">
          <div className="businessCopy">
            <p className="eyebrow">{copy.business.eyebrow}</p>
            <h2>{copy.business.title}</h2>
            <p>{copy.business.body}</p>
            <a className="secondaryButton" href="#waitlist">
              {copy.business.action}
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="businessCard">
            <div className="businessCardHeader">
              <div>
                <span>{copy.business.partnerLabel}</span>
                <strong>Northline Detailing</strong>
                <p>{copy.business.location}</p>
              </div>
              <b aria-hidden="true">N</b>
            </div>
            <div className="businessMap" aria-hidden="true">
              <span className="businessRoute" />
              <span className="businessPin">N</span>
            </div>
            <div className="businessStats">
              {copy.business.points.map((point, index) => (
                <span key={point}>
                  <b>0{index + 1}</b>
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="waitlist" className="section waitlistSection">
        <div className="shell waitlistPanel">
          <div className="waitlistCopy">
            <p className="eyebrow lightEyebrow">{copy.waitlist.eyebrow}</p>
            <h2>{copy.waitlist.title}</h2>
            <p>{copy.waitlist.body}</p>
          </div>
          <WaitlistForm locale={locale} copy={copy.waitlist} />
        </div>
      </section>

      <footer className="siteFooter">
        <div className="shell footerInner">
          <div>
            <strong>NOXA</strong>
            <p>{copy.footer.statement}</p>
            <span>S. KARAKETIDIS</span>
          </div>
          <nav aria-label={copy.footerNavigationLabel}>
            <a href="#product">{copy.footer.product}</a>
            <a href="#community">{copy.nav.community}</a>
            <a href="#business">{copy.nav.business}</a>
            <Link href="/privacy">{copy.footer.privacy}</Link>
            <Link href="/terms">{copy.footer.terms}</Link>
          </nav>
          <p className="footerLegalNote">{copy.footer.legalNote}</p>
          <span>© 2026 NOXA</span>
        </div>
      </footer>
    </main>
  );
}
