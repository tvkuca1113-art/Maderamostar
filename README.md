# Madera Mostar — web stranica (verzija 2)

Digitalni salon sobnih vrata za **Madera Mostar**: katalog s filterima, detalj modela, ilustrativni 3D konfigurator, kalkulator, projekt „Vrata za cijeli dom” i priprema upita.
Implementirano prema `docs/paket/CLAUDE-CODE-SUPERPROMPT.md` (verzija 2: svijetli studio, topli hrast, crveni CTA).

![Desktop](docs/screenshots/desktop-1440-hero.jpg)

## Pokretanje

```bash
npm install
npm run dev        # razvojni server (http://localhost:5173)
npm test           # Vitest: kalkulator, projekt, validacija, 3D mehanika, tok aplikacije
npm run build      # TypeScript provjera + produkcijski build u dist/
npm run preview    # pregled produkcijskog builda
npm run images     # ponovo generiše AVIF/WebP izvedenice slika (sharp)
```

Stack: React 18 + TypeScript + Vite 6, Three.js 0.169 + React Three Fiber 8 + drei 9 (kompatibilni par za React 18), Manrope (lokalno, bez Google Fonts), Vitest + Testing Library. Verzije su zaključane u `package-lock.json`.

## Šta je implementirano

- **Početna stranica** tačnim redoslijedom i tekstom iz superprompta: zaglavlje (ljepljivo, mobilni meni s Escape/fokusom), hero s posebnom mobilnom slikom (`<picture>`, AVIF/WebP), prečice „Pronađite svoj stil”, brzi kalkulator, ponuda modela, konfigurator, projekt, naši radovi, proces, česta pitanja, kontakt, footer.
- **Katalog**: 6 imenovanih modela + 5 izvedbi po želji, filteri (kategorija + potvrđene osobine), prazna poruka, „Pogledaj sve izvedbe”, detalj u pristupačnom modalu, lightbox s cijelim originalom (`object-fit: contain`, bez filtera).
- **3D konfigurator** (učitava se odvojeno, tek kad je sekcija blizu ekrana; na mobitelu dugmetom „Istraži u 3D”):
  - proceduralna geometrija: zid s otvorom, štok, lajsne, krilo, kvaka, rozeta i rozeta ključa; posebna geometrija za staklo s mrežom (2×5), dvokrilna (dva odvojena krila), klizna (vodilica, klizanje), skrivena (u ravnini zida) i lučno staklo;
  - krilo rotira oko ose baglama (pivot na stražnjem rubu, max 75°), kvaka i rozeta su djeca krila; štok i lajsne su statični;
  - Hrast furnir H: kvaka lijevo kao na fotografiji, godovi vodoravno na sredini i uspravno na bočnim dijelovima (proceduralna tekstura, ne fotografija);
  - render po potrebi (`frameloop="demand"`), pauza van ekrana, DPR ≤ 1,75, ograničena orbita, zoom dugmadima (skrol stranice se ne hvata), reset, `prefers-reduced-motion`, povratak na fotografiju kod WebGL greške;
  - natpis „Ilustrativni 3D prikaz. Konačna izvedba prema potvrđenoj specifikaciji.”; podrška za buduće GLB modele kroz `viewer.exactGlbPath` (čvorovi čije ime počinje s `pivot` se rotiraju).
- **Kalkulator** — jedno stanje za brzi kalkulator, konfigurator i projekt (`src/state/store.tsx`), obnova nakon osvježavanja (localStorage, bez kontakt podataka):
  - **Režim A** (sada): „Vaš izbor je spreman.” + specifikacija, bez ikakvog iznosa;
  - **Režim B**: aktivira se tek s odobrenim cjenovnikom i poreznim prikazom; pregled stavki, nedostajuća stopa = „Potrebna ponuda” (nikad 0), djelimičan međuzbir jasno označen, `Intl.NumberFormat('bs-BA', { currency: 'BAM' })`.
- **Projekt za cijeli dom**: prostorije (uključujući vlastiti naziv), Uredi / Dupliraj / Ukloni, zbir količine.
- **Upit bez lažnih potvrda**: ime, telefon, mjesto montaže (+ opcionalna poruka) → „Upit je pripremljen. Kontaktirajte Maderu i podijelite svoj izbor.”; Kopiraj upit (s rezervnim ručnim kopiranjem), Preuzmi svoj izbor (.txt) i JSON, Pozovi Maderu. Kod budućeg `contactForm.endpoint`: slanje, uspjeh tek nakon odgovora servera, očuvanje upita kod greške. WhatsApp dugme se pojavljuje tek kad je `whatsapp.enabled: true`.
- **Pristupačnost**: jedan H1, semantičke sekcije, vidljive oznake, nativni radio za opcije, `aria-pressed` filteri, live regioni, dijalozi s Escape/zadržanim fokusom/povratkom fokusa i neaktivnom pozadinom, skip link, mobilna donja akcija koja se skriva iznad kontakta/footera i dok je tastatura otvorena.

## Provjera

- `npm test` — 65 testova: režim A bez iznosa; režim B s kontroliranim testnim cjenovnikom (`tests/fixtures/`, ne ulazi u aplikaciju); nedostajuće stope i nepotpune mjere → „Potrebna ponuda”; tri prostorije nakon uređivanja, dupliranje, uklanjanje; „Ne znam mjere” i poruka za pogrešnu količinu; katalog → konfigurator → sažetak; kopiranje i preuzimanje; 3D: krilo/kvaka/rozeta se kreću zajedno, okvir miruje, SAT provjera kolizija za svih 11 izvedbi × 3 strane kvake (i negativni test koji dokazuje da provjera hvata koliziju); WebGL fallback + reduced motion.
- `npm run build` — TypeScript bez grešaka; početni JS ≈ 71 kB gzip, 3D dio (≈ 270 kB gzip) se učitava lijeno.
- Vizualno pregledano u Chromiumu na 1440×900, 1024×768, 390×844 i 320×740 (bez horizontalnog skrola, bez grešaka u konzoli). Screenshotovi: `docs/screenshots/`.

## Gdje se unose podaci

| Šta | Datoteka |
|---|---|
| Cijene, doplate (po `finish`/`handle` id), pravila mjera, montaža, doprema, porez, `approvedByOwner` | `data/pricing-template.json` (struktura opisana u `src/types.ts` → `PricingData`) |
| Kontakt, email, endpoint obrasca, WhatsApp, radno vrijeme | `data/site-config.json` |
| Modeli, opisi, odobrene obrade/okovi, GLB putanja | `data/products.json` |
| Id-jevi obrada i kvaka (`kao-na-fotografiji`, `bijela`, `hrast`, `tamna`, `siva`, `po-zelji`, `nisam-siguran`; `srebrna`, `crna`, `zlatna` …) | `src/lib/options.ts` |

Ključ koji nije u cjenovniku znači nepoznat trošak. Novčana procjena se prikazuje tek kad je `approvedByOwner: true` i `taxMode` postavljen.

## Šta vlasnik treba potvrditi prije javne objave

1. Aktuelne modele i izvedbe (imenovani modeli potiču iz objava iz 2021.).
2. Cjenovnik u KM: šta osnovna cijena uključuje, doplate, pravila mjera, montaža, doprema, porezni prikaz, važenje.
3. Dopuštene obrade i okove po modelu, proizvodne minimume/maksimume i postupak mjerenja.
4. Kanal za prijem upita (endpoint ili email) i eventualni WhatsApp broj.
5. Službeni veliki logo (u footeru je mali original 150 px), radno vrijeme, rokove i garancije koje želi navesti.
6. Domenu — tek tada dodati canonical, apsolutni `og:image` i strukturirane poslovne podatke; politiku privatnosti i analitiku samo uz potvrđenu konfiguraciju.
7. Potvrđene CAD/GLB modele za precizan 3D prikaz.

Hero slike su AI ilustracije ambijenta (označeno na stranici); galerija koristi samo originalne fotografije. Stranica nije automatski deployana.

## Struktura

```
data/                  podaci iz paketa (proizvodi, postavke, cjenovnik, manifest slika)
docs/paket/            originalni paket: superprompt, mapa slika, ponuda, referenca, istraživanje
docs/screenshots/      završni prikazi desktop/mobitel
public/images/madera/  originalne slike + opt/ (AVIF/WebP izvedenice)
scripts/               optimizacija slika
src/components/        sekcije stranice i dijalozi
src/lib/               opcije, validacija, cjenovni motor, sastavljanje upita
src/state/             zajedničko stanje (store) i UI stanje
src/three/             proceduralna 3D vrata, provjera kolizija, viewer
tests/                 Vitest testovi
```
