import { siteConfig } from '../data';
import { calcLabel, NAV } from './Header';

export function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <img className="site-footer__logo" src="/images/brand/madera-logo-dark.svg" alt="Madera" width={1232} height={490} loading="lazy" />
          <p>{siteConfig.serviceText}</p>
        </div>
        <nav aria-label="Navigacija u podnožju">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
            <li>
              <a href="#kalkulator">{calcLabel()}</a>
            </li>
          </ul>
        </nav>
        <address className="site-footer__contact">
          <span>{siteConfig.locationText}, Hercegovina</span>
          <a href={siteConfig.phoneHref}>{siteConfig.phoneDisplay}</a>
          <a href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram @madera.mostar
          </a>
        </address>
      </div>
      <div className="container site-footer__legal">
        <p>© {new Date().getFullYear()} Madera Mostar</p>
        <p>Hero slike su ilustracije ambijenta. Fotografije vrata su originali iz Maderinih objava.</p>
      </div>
    </footer>
  );
}
