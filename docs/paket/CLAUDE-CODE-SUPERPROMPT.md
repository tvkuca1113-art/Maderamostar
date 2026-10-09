# MADERA MOSTAR — SUPERPROMPT ZA CLAUDE CODE — VERZIJA 2

Kopiraj tekst ispod u Claude Code nakon što raspakuješ cijeli paket u radnu mapu projekta. Slike, podaci i referenca moraju ostati dostupni Claudeu.

---

Ti si senior frontend inženjer i dizajner digitalnih iskustava za arhitekturu i interijere. Izradi kompletnu, funkcionalnu i vizualno dotjeranu web stranicu za **Madera Mostar**, proizvođača sobnih vrata. Odabrani izgled je **verzija 2: svijetli arhitektonski studio, topli hrast, snažna crvena akcijska dugmad, izbor modela i istaknut kalkulator**.

Radi do dovršene implementacije i provjerenog prikaza na računaru i telefonu. Koristi slike iz paketa, originalne fotografije ponude i tačne poslovne podatke. Donosi rutinske dizajnerske odluke samostalno. Za nepoznate poslovne podatke primijeni opisane rezervne tokove, a potrebne potvrde navedi u završnom izvještaju. Nemoj objavljivati stranicu ili uključivati plaćene servise bez zasebne upute.

## 1. Prvo pročitaj paket i postojeći projekt

Pročitaj:

- `reference/verzija-2-odabrani-izgled.png` — autoritativna vizualna referenca za raspored, tipografiju, paletu i odnos prostora i vrata.
- `MAPA-SLIKA.md` — mjesto, način prikaza i opis svake slike.
- `PONUDA-VRATA.md` i `data/products.json` — šest imenovanih modela i pet primjera posebnih izvedbi.
- `data/site-config.json` — kontakt, područje rada i poslovne postavke.
- `data/pricing-template.json` — prazna struktura za odobreni cjenovnik.
- `data/asset-manifest.json` — dimenzije, izvor, alt tekst i putanja svih slika.
- `reference/instagram-i-medunarodna-istrazivanja.md` — istraživanje profila i međunarodnih primjera.

Pregledaj repozitorij, postojeće upute, package manager i komponente. Sačuvaj postojeću funkcionalnost i uklopi novo rješenje u postojeći stack. Ako je projekt prazan, koristi React, TypeScript i Vite, uz Three.js i React Three Fiber za 3D prikaz. Biraj međusobno kompatibilne stabilne verzije i zaključaj ih u lockfileu. Službena dokumentacija trenutno povezuje R3F 8 s Reactom 18, a R3F 9 s Reactom 19; provjeri kompatibilnost pri instalaciji. Ne uvodi drugi framework samo radi jedne sekcije.

Napravi jednu uređenu početnu stranicu, katalog s filterima, detalj modela i konfigurator povezan s kalkulatorom i upitom. Detalj može biti pristupačan modal ili ruta, ovisno o postojećem projektu. Korisnik mora moći završiti cijeli tok od modela do pregleda upita.

## 2. Poslovni cilj i provjerene činjenice

Glavni cilj: posjetilac treba lako pronaći izgled vrata, razumjeti opcije i zatražiti konkretnu ponudu za jednu prostoriju ili cijeli dom.

Provjereno iz Maderinog profila:

- Izrada, doprema i montaža sobnih vrata na području Hercegovine.
- Mostar, Opine b.b.
- Telefon: **061/275-936**, poveznica `tel:+38761275936`.
- Instagram: `https://www.instagram.com/madera.mostar/`.
- Imenovani modeli u objavama: Hrast furnir H, Patras, Olimpus, Milano, Sara i Anatolija.
- Postoje primjeri staklenih, dvokrilnih, kliznih i skrivenih vrata, zlatnih detalja, hrom lajsni, CNC linija, skrivenih baglama i magnetnih brava. Te osobine nisu potvrđene za svaki model.

Cjenovnik, rok izrade, garancija, radno vrijeme, email i aktuelna dostupnost modela nisu potvrđeni. Ovi podaci ostaju konfigurabilni. Nemoj dodavati izmišljene brojke, ocjene, izjave kupaca, popuste ili značke „najprodavanije”. Imenovani modeli dolaze iz starijih objava; prikazuj ih kao primjere modela i upit za izvedbu dok vlasnik ne potvrdi aktuelni katalog.

Sav vidljivi tekst piši na pravilnom bosanskom jeziku, s č, ć, ž, š i đ. Koristi „vrata”, „kvaka”, „obrada”, „mjere”, „doprema”, „montaža” i „ponuda”. Ne prikazuj razvojne izraze poput GLB, API ili proceduralni model u korisničkom toku.

## 3. Vizualni sistem odabrane verzije

Stranica treba djelovati kao uređeni digitalni salon vrata. Arhitektonski prostor, jasna tipografija i detalji proizvoda nose vizual. Izbjegni generičnu mrežu velikih zaobljenih kartica, nasumične gradijente i prenaglašene efekte.

Početni design tokeni:

| Token | Vrijednost | Namjena |
|---|---|---|
| `--canvas` | `#F7F4EE` | Topla svijetla podloga |
| `--surface` | `#FFFFFF` | Obrasci i sadržaj |
| `--ink` | `#24231F` | Naslovi |
| `--muted` | `#66645D` | Sekundarni tekst |
| `--line` | `#D8D3C9` | Diskretne linije |
| `--brand` | `#B61E24` | Glavna dugmad i aktivni izbor |
| `--brand-hover` | `#94191E` | Hover glavne akcije |
| `--oak` | `#A77343` | Mali materijalni akcent |

Provjeri kontrast teksta i fokus stanja na stvarnim podlogama. Koristi jednu kvalitetnu sans serif porodicu s podrškom za bosanske znakove, primjerice Manrope ili odgovarajuću postojeću porodicu. Naslovi imaju čistu, snažnu geometriju. Na desktopu H1 približno 64–88 px, na telefonu 36–44 px; prilagodi prelamanje stvarnim slikama. Body 16–18 px, mali pomoćni tekst najmanje 13–14 px.

Desktop sadržaj ispod hero sekcije ograniči na približno 1280 px uz bočne margine 32–64 px. Mobilna margina 20 px. Dugmad visine najmanje 48 px, mobilni dodirni ciljevi najmanje 44 px. Uglovi uglavnom 4–8 px. Razmak između glavnih sekcija 80–112 px na desktopu i 48–64 px na telefonu. Koristi tanku liniju i dovoljno praznog prostora.

U zaglavlju koristi tipografski naziv **Madera**, s crvenim početnim M, prema odabranoj referenci. Mali originalni raster logo nalazi se u paketu za footer. Službeni veliki logo kasnije zamijeni kvalitetnim izvornikom; nemoj povećavati raster od 150 px na veliki format.

## 4. Početna stranica, redoslijed i tačan tekst

### A. Zaglavlje

Lijevo brend, desno navigacija: **Modeli / Konfigurator / Naši radovi / Kontakt**. Istaknuto crveno dugme **Kalkulator** vodi do `#kalkulator`. Navigacija na telefonu prelazi u jednostavan meni s istim stavkama. Zaglavlje je ljepljivo, s tankom donjom linijom i diskretnom pozadinom nakon skrolanja. Poveznice vode do stvarnih sekcija. Aktivni meni ne smije sakriti fokus ili skrol.

### B. Hero — glavni arhitektonski prizor

Desktop: `public/images/madera/hero-hrast-desktop.png` kao širok prizor preko cijele širine. Tekst je stvarni HTML na lijevoj mirnoj plohi slike. Hrastova vrata ostaju desno, u cijelosti vidljiva. Slika nema vlastiti tekst. Nemoj ugrađivati sliku laptopa ili mobitela iz reference u stranicu.

H1, u dvije linije:

**Vaša vrata.**  
**Vaš izbor.**

Podnaslov:

**Odaberite model, boju i detalje. Zatražite ponudu za svoj dom.**

Manji servisni red:

**Izrada, doprema i montaža sobnih vrata u Hercegovini.**

Glavna akcija: **Odaberi svoja vrata** → `#konfigurator`.  
Sekundarna akcija: **Pogledaj modele** → `#modeli`.

Ispod teksta mali izbor „Pronađite svoj stil”: četiri dostupna vizualna primjera **Hrast / Bijela / Tamna sa staklom / Skrivena**. To su prečice do odgovarajućih zapisa u konfiguratoru, a ne obećanje da svaki model postoji u svim obradama. Izbor ažurira stvarno ime modela i otvara njegov prikaz u konfiguratoru. Aktivno stanje ima crveni prsten i tekstualnu oznaku.

Telefon: koristi poseban `hero-hrast-mobile.png` preko `<picture>`. Naslov i kratki podnaslov staju u prazni gornji dio slike. Glavna akcija može biti u donjem dijelu iznad poda; sekundarna akcija i prečice mogu ići odmah ispod slike. Ako tekst ne stane na malom ekranu, dodaj miran prostor iznad slike u istoj podlozi. Sačuvaj cijela vrata i kvaku. Prikaz na 320 px mora ostati čitljiv. Zadrži isti vizualni identitet na svim ekranima.

Slika je AI ilustracija ambijenta prema originalnim hrastovim vratima. U detalju ovog prikaza ili uz diskretan opis navedi **„Ilustracija ambijenta”**. Galerija stvarnih radova koristi samo originalne fotografije.

### C. Brzi kalkulator, odmah nakon hero sekcije

Naslov: **Kalkulator izrade vrata**.  
Opis: **Odaberite vrata i osnovne mjere. Pripremite upit za svoj dom.**

U širokoj svijetloj traci prikaži odabrani model, **Širina otvora (cm)**, **Visina otvora (cm)**, **Broj vrata**, **Mjesto montaže** i dugme **Pripremi procjenu**. Polja za mjere su prazna, s primjerom u placeholderu; nemoj slati primjer 80/200 kao stvarnu mjeru. „Ne znam mjere” uklanja obaveznost dimenzija. Promjena modela ili količine ovdje i u konfiguratoru dijeli isto stanje.

Pomoćni tekst: **Konačna ponuda nakon potvrde mjera i odabrane izvedbe.**

Dok odobreni cjenovnik nije unesen, rezultat prikazuje konfiguraciju i akciju **Zatraži ponudu**. Kada je cjenovnik potpun i odobren, prikaži informativnu procjenu u KM. Detaljna pravila su u dijelu 6.

### D. Ponuda modela

Naslov: **Pronađite vrata za svoj prostor.**  
Opis: **Od toplog hrastovog furnira do čistih bijelih ploha i staklenih izvedbi.**

Filteri: **Sva vrata / Moderna / Klasična / Furnir / Staklo / Klizna / Skrivena / Dvokrilna / Po želji**. Filtriranje koristi `category` i potvrđene osobine. Kategorija bez rezultata ima razumljivu praznu poruku.

Prvih šest kartica redom: **Hrast furnir H, Patras, Olimpus, Milano, Sara, Anatolija**. Zatim prikaži pet posebnih izvedbi. Imena posebnih izvedbi su opisni nazivi, nemoj ih predstavljati kao službene nazive modela. Na početnoj stranici možeš prikazati šest kartica i dugme **Pogledaj sve izvedbe**, koje stvarno proširuje katalog.

Kartica: originalna fotografija, ime, jedna rečenica iz `description`, mala oznaka **Primjer modela** ili **Izvedba po želji**, akcija **Pogledaj detalje**. Nemoj dodavati cijenu kad je vrijednost `null`. Fotografije prikazuj u urednim jednakim okvirima s `object-fit: contain`, bez rezanja proizvoda. Svijetla galerijska podloga može ujednačiti različite fotografije.

Detalj modela: veća originalna fotografija, potvrđene osobine, željene opcije koje trebaju potvrdu, akcija **Odaberi za svoj dom**. Fotografija se može otvoriti u pristupačnom lightboxu u izvornom odnosu stranica. Ne izmišljaj presjek jezgre, zvučnu izolaciju, certifikate, težinu ili materijal okvira na temelju fotografije.

### E. Istaknuti interaktivni konfigurator

Naslov: **Vaša vrata, u svakom detalju.**  
Opis: **Istražite izgled, odaberite detalje i dodajte vrata svom upitu.**

Desktop: veliki mirni 3D prikaz lijevo, sažet panel opcija desno. Telefon: prikaz iznad opcija. Konfigurator je važna sekcija stranice i lako je dostupan iz hero prečica.

Opcije: model, željena obrada, željena kvaka, način otvaranja ako je poznat, približne mjere otvora, debljina zida ako je poznata, broj vrata i prostorija. „Nisam siguran/na” je dozvoljen odgovor. Razdvoji **osobine prikazane izvedbe** od **želje za ponudu**. Za nepotvrđene dodatke pokaži „Dostupnost uz potvrdu”.

Prikaži sliku stvarnog odabranog proizvoda uz 3D ilustraciju ili kroz prekidač **Fotografija / 3D prikaz**. Kontrole: **Otvori vrata / Zatvori vrata / Vrati pogled**. Klik na izbor uvijek ažurira sažetak. Glavna akcija **Dodaj u moj projekt** dodaje stavku u kalkulator za cijeli dom. Jednostavniji tok ima **Zatraži ponudu za ova vrata**.

### F. Vrata za cijeli dom

Naslov: **Jedan izbor. Cijeli dom.**  
Opis: **Dodajte vrata za svaku prostoriju i pošaljite jedan pregledan upit.**

Stavka sadrži prostoriju, model, željene detalje, približne mjere ili oznaku da nisu poznate, količinu te akcije Uredi / Dupliraj / Ukloni. Redovi se mogu razlikovati. Sažetak zbraja ukupnu količinu i troškove koji imaju odobrene stope. Ne postoji automatski popust za veću količinu bez podatka vlasnika.

Primjeri naziva prostorija u izborniku: Spavaća soba, Dnevni boravak, Kupatilo, Hodnik, Drugo. Korisnik može unijeti svoj naziv. Projekt počinje bez izmišljenih stavki. Nakon prvog dodavanja jasno pokaži šta je dodano i omogući povratak u katalog.

### G. Originalni radovi

Naslov: **Vrata u stvarnim prostorima.**  
Opis: **Pogledajte primjere izvedbi objavljene na Maderinom profilu.**

Koristi originalne fotografije hrasta, bijele izvedbe sa zlatnim detaljima, tamne staklene i skrivene izvedbe. Raspored može imati jednu veću i tri manje fotografije. Lightbox čuva cijeli original. Ispod navedi stvarnu vrstu izvedbe, bez izmišljenog imena klijenta, lokacije pojedinog projekta ili datuma završetka. Poveznica **Više na Instagramu** vodi na profil. Bez teškog Instagram embeda i automatskog učitavanja trećih servisa.

### H. Proces

Naslov: **Od izbora do ugradnje.**

1. **Odaberite izgled** — Pronađite model i detalje koji odgovaraju vašem prostoru.
2. **Pošaljite upit** — Dodajte približne mjere, količinu i mjesto montaže.
3. **Potvrdite izvedbu** — S Maderom dogovorite tačne mjere, opcije i ponudu.
4. **Izrada, doprema i montaža** — Daljnji koraci prema potvrđenom dogovoru.

Ne obećavaj rok od određenog broja dana ili besplatno mjerenje bez potvrde.

### I. Česta pitanja

- **Nemam tačne mjere. Mogu li poslati upit?** — Da. Odaberite „Ne znam mjere” i navedite broj vrata i mjesto montaže. Tačne mjere potvrđuju se prije konačne ponude.
- **Mogu li birati boju i detalje?** — Na profilu su prikazane izvedbe po želji kupca. Dostupne kombinacije za odabrani model potvrđuje Madera.
- **Radite li dopremu i montažu?** — Madera navodi izradu, dopremu i montažu sobnih vrata na području Hercegovine. U upitu navedite mjesto montaže.
- **Da li je iznos iz kalkulatora konačna cijena?** — Procjena je informativna kada je cjenovnik dostupan. Konačna ponuda zavisi od potvrđenih mjera, izvedbe, dopreme i montaže.

### J. Završni kontakt

Naslov: **Koja vrata zamišljate u svom domu?**  
Tekst: **Pošaljite svoj izbor i osnovne podatke za ponudu.**  
Akcije: **Pripremi upit** i **Pozovi 061/275-936**.

Kontakt: **Mostar, Opine b.b. / Hercegovina / 061/275-936 / Instagram @madera.mostar**. Email i radno vrijeme prikaži tek nakon unosa stvarnih podataka. Footer koristi originalni mali logo, navigaciju i kontakt. Godina autorskog reda može biti dinamička; ona ne znači godinu osnivanja.

## 5. Stvarna 3D interakcija i fizički ispravna vrata

Paket sadrži fotografije i ambijentalne ilustracije, **ne sadrži proizvodne 3D modele**. Ipak napravi funkcionalan 3D demonstracijski prikaz od prave geometrije, uz mogućnost zamjene potvrđenim GLB modelom kroz podatke. Ovo je ilustracija izgleda, a fotografija ostaje izvor za stvarni proizvod.

Za početni ilustrativni model Hrast furnir H napravi krilo, stiles/obrub prema fotografiji, zaseban štok i lajsne, kvaku, rozetu i zid s otvorom. Za geometriju možeš koristiti dokumentirane demonstracijske proporcije približno 0,80 × 2,00 m i debljinu krila 0,04 m. Te vrijednosti nisu potvrđene proizvodne mjere niti opseg naručivanja. Nemoj ih automatski ubaciti u upit korisnika.

Važna mehanika:

- Krilo rotira oko vertikalne osi na rubu baglama. Štok, zid i lajsne ostaju nepomični.
- Kvaka i rozeta su djeca grupe krila, pa se pomjeraju zajedno s njim.
- Kod originalnog Hrast furnir H kvaka je lijevo gledano kao na priloženoj fotografiji; nemoj ogledalno okrenuti referencu. Osa otvaranja je na suprotnoj strani.
- Geometrija otvora i smjer otvaranja dozvoljavaju kretanje krila bez prolaska kroz zid, štok ili pod. Raspon animacije izaberi prema sceni, npr. do 70–80°, uz provjeru kolizije.
- Nemoj uvoditi naziv DIN lijevo/desno bez jasnog prikaza strane posmatranja. Ako korisnik ne zna smjer, upit ostaje „Potrebna potvrda”.
- Na demo teksturi hrastovi godovi na središnjem polju idu vodoravno, na bočnim dijelovima uspravno, prema fotografiji. Nema rastegnutog uzorka preko kvake.
- Tamna staklena fotografija pokazuje mrežu s dvije kolone i pet redova. Bijela dvokrilna pokazuje odvojena krila; nemoj dvokrilni sistem pretvarati u jedno široko krilo.
- Staklena, dvokrilna, klizna i skrivena vrata trebaju odgovarajuću geometriju i mehaniku. Ako nemaš kvalitetan prikaz pojedine izvedbe, zadrži njenu stvarnu fotografiju i opcije za upit. Nemoj primijeniti generičnu animaciju hrastovog krila na svaki tip vrata.

Uz demonstracijski viewer vidljivo, diskretno napiši **„Ilustrativni 3D prikaz. Konačna izvedba prema potvrđenoj specifikaciji.”**. Za potvrđene GLB modele kasnije koristi materijale i nazive čvorova iz stvarnih modela. Polje `exactGlbPath` je sada `null`; ne izmišljaj putanju datoteke.

3D viewer se učitava odvojeno od hero slike. Ne postavljaj dodatna 3D vrata preko vrata koja su već na fotografiji. Scena ima svijetli studio, mekanu kontaktnu sjenu i realističnu obradu. Omogući ograničenu orbitu, zoom i reset. Zaustavi automatsko okretanje, skrol stranice ne hvataj viewerom. Otvaranje radi tek na namjernu akciju. Prije učitavanja pokaži stvarnu fotografiju kao poster. Na mobitelu aktiviraj 3D dugmetom **Istraži u 3D**.

Za render koristi rad po potrebi, ograniči DPR prema uređaju i pauziraj van ekrana. Pri WebGL grešci prikaz se vraća na fotografiju, dok opcije i upit ostaju funkcionalni. Podržavaj `prefers-reduced-motion`; korisnik dobija direktno odabrano stanje bez dugih animacija. Ako izrađuješ materijal drveta bez kvalitetne teksture, koristi diskretan proceduralni uzorak ili odgovarajući dostupan izvor; nemoj koristiti cijelu fotografiju s kvakom kao teksturu plohe.

## 6. Kalkulator: oba režima moraju stvarno raditi

Zajednički podaci konfiguratora, brzog kalkulatora i projekta dolaze iz jednog izvora stanja. Izmjena jedne stavke ne smije obrisati ostale prostorije.

### Režim A — sadašnji podaci, bez odobrenog cjenovnika

`approvedByOwner: false` i nedostajuće stope znače da kalkulator priprema specifikaciju za ponudu. Rezultat:

**Vaš izbor je spreman.**  
**Zatražite ponudu za odabranu konfiguraciju. Konačnu cijenu potvrđuje Madera.**

Prikaži model, željenu obradu, kvaku, količinu, mjere ili „Nisu poznate”, mjesto montaže i spisak prostorija. Dugme **Nastavi na upit** otvara pregled i kontaktne opcije. Nemoj prikazati 0 KM kao stvarnu cijenu, nasumičan raspon ili poruku da je nešto poslano.

### Režim B — nakon odobrenja cjenovnika

Aktiviraj novčanu procjenu tek kada odobreni podaci pokrivaju izabrani model, opcije, dimenzijska pravila, dopremu, montažu i način prikaza poreza. Prikaži pregled stavki:

- osnovna cijena kompleta i jasno navedeno šta uključuje;
- doplata za obradu;
- doplata za okove;
- doplata za mjere samo prema odobrenim pravilima;
- količina × jedinična cijena;
- montaža i doprema prema cjenovniku;
- ukupan informativni iznos.

Nedostajuća cijena je nepoznat trošak, a ne nula. Ako je samo dio projekta obračunat, jasno označi poznati međuzbir i stavke koje trebaju ponudu. Ne prikazuj ga kao ukupnu cijenu projekta. Sve iznose formatiraj preko `Intl.NumberFormat('bs-BA', { style: 'currency', currency: 'BAM' })`, uz razumljiv prikaz u KM. Porez i osnovu ne pretpostavljaj.

Mjere otvora, mjere krila i debljina zida su različiti podaci. Ne preračunavaj ih bez Maderinih pravila. Validiraj pozitivne razumne brojeve, decimalni zarez, cjelobrojnu količinu i prazna polja. Provjereni proizvodni minimumi i maksimumi dolaze iz podataka. Ne odbijaj kupca proizvoljnim dimenzijskim limitom; nestandardne ili nepotvrđene mjere preusmjeri na ponudu.

## 7. Upit i kontakt bez lažnih potvrda

Kontaktni panel traži ime, telefon i mjesto montaže, uz opcionalnu poruku. Ne traži punu adresu, email ili fotografije stana kao obavezne podatke. Tačna adresa može se dogovoriti kasnije.

Sažetak upita mora biti lako čitljiv, npr.:

> Upit za Madera vrata. Mjesto montaže: Mostar. Ukupno: 3 vrata. Spavaća soba: Hrast furnir H, 1 kom., mjere nisu poznate. Hodnik: Patras, 2 kom., željena bijela obrada. Molim ponudu i potvrdu dostupnih opcija.

`contactForm.endpoint` i email trenutno su `null`, WhatsApp je isključen do potvrde vlasnika. U ovom režimu:

- **Kopiraj upit** kopira tekst, s pristupačnom potvrdom ili rezervnim prikazom za ručno kopiranje.
- **Preuzmi svoj izbor** preuzima sažetak u tekstualnom ili JSON formatu.
- **Pozovi Maderu** koristi potvrđeni telefon.
- Vidljiva poruka glasi **„Upit je pripremljen. Kontaktirajte Maderu i podijelite svoj izbor.”**

Kada vlasnik potvrdi WhatsApp broj, možeš uključiti dugme za otvaranje korisnikove aplikacije s pripremljenim tekstom. Konačno slanje radi korisnik. Kada se konfigurira stvarni endpoint, implementiraj server validaciju, loading, uspjeh samo nakon potvrđenog odgovora i očuvanje upita kod greške. Ne izmišljaj email ili endpoint. Ne uvodi checkout, naplatu ili obavezujuću narudžbu bez cijena i uslova.

Anonimnu konfiguraciju možeš sačuvati lokalno. Kontaktne podatke ne čuvaj trajno u localStorageu, URL-u ili analytics logovima. Projekt se može obnoviti nakon osvježavanja bez ponovnog unosa svih opcija. Analytics, politika privatnosti i saglasnosti ulaze tek s potvrđenom konfiguracijom; nemoj generirati lažni pravni dokument.

## 8. Fotografije, responsive prikaz i performanse

Svaka slika ima tačno mjesto u `MAPA-SLIKA.md`. Fotografske originalne datoteke zadrži kao izvornik. Ako stack podržava automatsko pravljenje optimiziranih izvedenica, napravi odgovarajući AVIF/WebP i responsive `srcset`, uz izvornik za pregled. Nemoj mijenjati proizvod, broj panela, kvaku ili staklo radi ujednačavanja kataloga.

Hero ima prioritetno učitavanje, poznate dimenzije i posebnu mobilnu verziju. Ostale fotografije su lazy loaded. Nemoj odsjeći vrh lajsne, kvaku ili dno vrata na ciljnim ekranima. Hero može koristiti prirodni odnos stranica uz pažljivo postavljen tekst; ako skratiš sekciju, provjeri kompoziciju i izbjegni rezanje proizvoda.

Katalog originala koristi `contain`; lightbox prikazuje cijelu sliku. Galerie ne uvode CSS filter koji mijenja boju proizvoda. U dekorativnim prizorima dopusti diskretnu animaciju ulaska od približno 200–400 ms, uz reduced motion. Nemoj raditi scroll hijacking, dugo čekanje na intro animaciju ili automatsko otvaranje modala.

Semantički HTML, jedan H1, smislen redoslijed H2/H3, vidljive oznake inputa, pristupačni filteri i radiobutton swatchevi, keyboard navigacija, jasan fokus i live region za rezultat. Modal i meni podržavaju Escape, kontrolisan fokus i povratak fokusa. Na telefonu ljepljiva donja akcija **Moj izbor** ili **Zatraži ponudu** ne prekriva polja ni footer; poštuj safe area.

SEO: `lang="bs"`, title **Madera Mostar | Sobna vrata po mjeri**, opis **Izrada, doprema i montaža sobnih vrata u Hercegovini. Istražite modele i pripremite upit za svoj dom.**. Canonical unesi tek s potvrđenom domenom. Strukturirane poslovne podatke dodaj samo iz potvrđenih vrijednosti. Ne dodaj izmišljene recenzije ili ponude cijena. Open Graph može koristiti ambijentalnu hero sliku, uz ispravnu stvarnu URL putanju nakon postavljanja domene.

## 9. Provjera prije predaje

Provjeri build, TypeScript i postojeće relevantne provjere. Dodaj smislene testove za kalkulator i tok projekta:

1. Bez cjenovnika rezultat priprema upit i ne proizvodi iznos.
2. U kontroliranim testnim podacima količina, poznate doplate i troškovi daju očekivani zbroj; testni cjenovnik ne ulazi u javnu ponudu.
3. Nedostajuća stopa i nepotpune dimenzije vraćaju „Potrebna ponuda”.
4. Tri različite prostorije ostaju sačuvane nakon uređivanja jedne; dupliranje i uklanjanje rade.
5. „Ne znam mjere” omogućava završetak upita; pogrešna količina ima jasnu poruku.
6. Odabir modela u katalogu ažurira konfigurator i sažetak. Sažetak se može kopirati i preuzeti.
7. 3D krilo, kvaka i rozeta pomjeraju se zajedno, a okvir ostaje na mjestu. Nema vidljivih kolizija, duplih vrata ili pogrešnog smjera.
8. WebGL fallback i reduced motion zadržavaju funkcionalan izbor i kontakt.

Vizualno pregledaj najmanje 1440 × 900, 1024 × 768, 390 × 844 i 320 × 740. Provjeri tekst preko hero slike, cijeli proizvod, prelamanje nav stavki, duže nazive modela, kalkulator, prazne rezultate, modal i donju mobilnu akciju. Ne završavaj samo prolaskom builda; otvori stranicu i popravi uočene vizualne probleme.

## 10. Gotovo znači

- Stranica prepoznatljivo prati odabranu verziju 2: svijetli studio, hrast, crveni CTA, velika čista tipografija i kvalitetan prikaz na telefonu.
- Sve fotografije su stvarno učitane, a svaki model i izvor odgovaraju zapisima paketa.
- Funkcionalni 3D demonstracijski viewer, originalne fotografije, izbor opcija, kalkulator i projekt za više prostorija rade povezano.
- Nedostajući poslovni podaci imaju razumljiv rezervni tok.
- Svako vidljivo dugme ima smislen rezultat; kontaktni tok jasno razlikuje pripremljen upit od poslanog upita.
- Build i relevantni testovi prolaze; završni screenshotovi pokazuju desktop i mobilni prikaz.
- Predaj kratak izvještaj: šta je implementirano, kako je provjereno, gdje se unose cijene i šta vlasnik treba potvrditi prije javne objave. Navedi tačne promijenjene datoteke. Nemoj automatski deployati.

## Istraživačka inspiracija i službena dokumentacija

Preuzmi principe, a vizual i sadržaj razvij za Maderu:

- TruStile: vizualni izbor detalja, sažetak specifikacije i projekt s više vrata — https://www.trustile.com/door-visualizer i https://www.trustile.com/configurator/overview
- Lualdi Milano: arhitektonski prostor i osjećaj digitalnog salona — https://www.lualdiporte.com/en/showroom/showroom-milan/
- Ermetika: izbor mjera i konstrukcijskih uslova — https://www.ermetika.com/en/configurator
- Aurea Lab / DirectPortes: WebGL konfiguracija modela i detalja — https://aurealab.net/configuratore-3d-porte-interne/?lang=en
- OPPEIN Dubai: prostorni prikaz kolekcija — https://www.oppein.ae/
- Oikos Middle East: veliki arhitektonski prizor i jednostavan projektni upit; ovo je susjedna kategorija ulaznih vrata — https://oikos-me.com/
- R3F instalacija i kompatibilnost — https://r3f.docs.pmnd.rs/getting-started/installation
- Three.js render po potrebi — https://threejs.org/manual/pages/rendering-on-demand.html
- Three.js responsive prikaz — https://threejs.org/manual/pages/responsive.html

Implementiraj ovo kao stvaran, pregledan salon koji vodi kupca do konkretnog izbora i ponude. Dovrši cijeli tok i provjeri ga prije završnog odgovora.
