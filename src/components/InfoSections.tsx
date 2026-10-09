import { siteConfig } from '../data';
import { useUi } from '../state/ui';
import { ArrowIcon } from './Header';

const STEPS = [
  { title: 'Odaberite izgled', text: 'Pronađite model i detalje koji odgovaraju vašem prostoru.' },
  { title: 'Pošaljite upit', text: 'Dodajte približne mjere, količinu i mjesto montaže.' },
  { title: 'Potvrdite izvedbu', text: 'S Maderom dogovorite tačne mjere, opcije i ponudu.' },
  { title: 'Izrada, doprema i montaža', text: 'Daljnji koraci prema potvrđenom dogovoru.' },
];

export function Process() {
  return (
    <section className="section process" id="proces" aria-labelledby="proces-naslov">
      <div className="container">
        <div className="section__head">
          <h2 id="proces-naslov">Od izbora do ugradnje.</h2>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="step__title">{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: 'Nemam tačne mjere. Mogu li poslati upit?',
    a: 'Da. Odaberite „Ne znam mjere” i navedite broj vrata i mjesto montaže. Tačne mjere potvrđuju se prije konačne ponude.',
  },
  {
    q: 'Mogu li birati boju i detalje?',
    a: 'Na profilu su prikazane izvedbe po želji kupca. Dostupne kombinacije za odabrani model potvrđuje Madera.',
  },
  {
    q: 'Radite li dopremu i montažu?',
    a: 'Madera navodi izradu, dopremu i montažu sobnih vrata na području Hercegovine. U upitu navedite mjesto montaže.',
  },
  {
    q: 'Da li je iznos iz kalkulatora konačna cijena?',
    a: 'Procjena je informativna kada je cjenovnik dostupan. Konačna ponuda zavisi od potvrđenih mjera, izvedbe, dopreme i montaže.',
  },
];

export function Faq() {
  return (
    <section className="section faq" id="pitanja" aria-labelledby="pitanja-naslov">
      <div className="container container--narrow">
        <div className="section__head">
          <h2 id="pitanja-naslov">Česta pitanja</h2>
        </div>
        <div className="faq__list">
          {FAQ.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>
                <h3>{f.q}</h3>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const { openInquiry } = useUi();
  return (
    <section className="section contact" id="kontakt" aria-labelledby="kontakt-naslov">
      <div className="container contact__inner">
        <div>
          <h2 id="kontakt-naslov">Koja vrata zamišljate u svom domu?</h2>
          <p className="section__lead">Pošaljite svoj izbor i osnovne podatke za ponudu.</p>
          <div className="contact__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => openInquiry('project')}>
              Pripremi upit
              <ArrowIcon />
            </button>
            <a className="btn btn--ghost btn--lg" href={siteConfig.phoneHref}>
              Pozovi {siteConfig.phoneDisplay}
            </a>
          </div>
        </div>
        <address className="contact__details">
          <p>
            <span className="contact__label">Lokacija</span>
            {siteConfig.locationText}
          </p>
          <p>
            <span className="contact__label">Područje rada</span>
            Hercegovina
          </p>
          <p>
            <span className="contact__label">Telefon</span>
            <a href={siteConfig.phoneHref}>{siteConfig.phoneDisplay}</a>
          </p>
          <p>
            <span className="contact__label">Instagram</span>
            <a href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
              @madera.mostar<span className="visually-hidden"> (otvara se u novom prozoru)</span>
            </a>
          </p>
          {siteConfig.contactForm.email && (
            <p>
              <span className="contact__label">Email</span>
              <a href={`mailto:${siteConfig.contactForm.email}`}>{siteConfig.contactForm.email}</a>
            </p>
          )}
          {siteConfig.hours && (
            <p>
              <span className="contact__label">Radno vrijeme</span>
              {siteConfig.hours}
            </p>
          )}
        </address>
      </div>
    </section>
  );
}
