# Madera Mostar — Claude Code prompt za popravku postojeće stranice

Kopiraj cijeli tekst ispod u Claude Code otvoren u repozitoriju Maderamostar. Paket s auditom i slikama koristi kao dokaz sadašnjeg stanja. Ovaj prompt je specifikacija posla, ne tvrdnja da su popravke već implementirane.

---

Ti si senior frontend inženjer, dizajner digitalnih proizvoda i stručnjak za Three.js/R3F. Popravi postojeću Madera Mostar stranicu tako da izgleda profesionalno, radi pouzdano na telefonu i desktopu i vodi kupca do jasnog upita za ponudu. Implementiraj promjene u postojećem projektu; ne završi samo planom.

## 1. Početak i granice

Repozitorij: tvkuca1113-art/Maderamostar.
Pregledana objavljena verzija: 5944e08afd706c724cf29d7fac1c40d596a0efc2.
Prvo provjeri sadašnji branch, promjene i AGENTS.md. Ako je kod noviji, prilagodi rješenje stvarnom stanju; nemoj slijepo vraćati ovu verziju ili prepisati tuđi rad.
Pročitaj Madera-Audit.md, data/products.json, data/asset-manifest.json, data/site-config.json i docs/paket.

Postojeći stack pregledane verzije:
- Vite, React 18.3.1 i TypeScript.
- Three.js 0.169.0.
- @react-three/fiber 8.18.0 i @react-three/drei 9.122.0.
- CSS u src/styles.css i zajedničko stanje u src/state/store.tsx.

Zadrži radnu osnovu i postojeće testove. Nadogradnju zavisnosti radi samo kad postoji konkretan razlog i provjerena kompatibilnost. Ne zamjenjuj cijelu stranicu generičkim šablonom.

Radi na branchu i napravi lokalno pregledan rezultat. Pripremi preview ako je dostupan u postojećem toku. Ovaj prompt ne zahtijeva automatski produkcijski deployment.

Poslovne činjenice: Madera, sobna vrata, Mostar Opine b.b., Hercegovina, izrada/doprema/montaža, telefon 061/275-936, Instagram @madera.mostar. Dostupnost ranije objavljenih modela i novih opcija potvrđuje firma. Ne izmišljaj cijene, recenzije, garanciju, rok izrade ili iskustvo.

## 2. Šta audit potvrđuje

Desktop hero ima dobru osnovu; problem je mobile kompozicija i dužina toka. Katalog prikazuje 6/11 zapisa, filter Staklo vraća 4 i proširenje otvara 11. Odabir modela, mjere s decimalnim zarezom, dodavanje, uređivanje, dupliranje, uklanjanje i čuvanje projekta rade.

U korisnikovom Safariju snimljen je veliki prazan viewer. Root cause nije konačno potvrđen. Nemoj proglasiti nepostojanje GLB-a jedinim uzrokom: proceduralni modeli već postoje.

Potvrđeni rizici u kodu:
- hasWebGL prihvata i WebGL 1, iako renderer u korištenom Three.js zahtijeva WebGL 2.
- ReadySignal potvrđuje montiranje, a ne uspješno prikazan prvi kadar.
- ready se ne resetuje pri novoj sesiji viewera.
- Nema eksplicitnog kontekst-lost toka i vremenskog ograničenja učitavanja.
- Frameloop demand/never mora se pravilno vratiti u rad pri dolasku u viewport.
- Postojeće dimenzije 3D-a su demonstracijske; unesene mjere otvora nisu automatski dimenzije krila.

Dodatni problem: kada projekt ima Milano 3 kom., a kalkulator pokazuje Sara 1 kom., Nastavi na upit šalje korisnika na postojeći Milano projekt. Upozorenje postoji, ali poslije akcija. To treba učiniti jasnim.

Cjenovnik nije odobren; kontaktni endpoint i e-mail su null, a WhatsApp je isključen. Trenutno se priprema tekst upita i ne dostavlja automatski firmi.

## 3. Vizuelni pravac

Zadrži svijetli arhitektonski studio: topli hrast, prirodno svjetlo, prljavo bijela, tamni tekst i Maderina crvena za primarnu akciju. Produkt je glavni vizual. Jedna dominantna akcija po bloku; umjerena tipografija, disciplinovani razmaci i kvalitetne fotografije.

Ne dodaj plutajuće ukrasne 3D predmete, generičke brojčane benefite ili niz sličnih zaobljenih kartica. Animacija treba objasniti promjenu i proizvod. Poštuj prefers-reduced-motion.

Copywriting na pravilnom bosanskom:
- H1: Vaša vrata. Vaš izbor.
- Kratki opis: Odaberite izgled. Pripremite ponudu za svoj dom.
- Glavna hero akcija: Kreiraj svoj izbor.
- Druga akcija: Pogledaj modele.
- Jedan naziv projekta svuda: Moj izbor.
- Jasna informacija: Izrada i montaža u Hercegovini.

Uredi raspored:
Hero → istaknuti planer/cjenovni kalkulator prema dostupnim podacima → kompaktan katalog → konfigurator → Moj izbor → stvarne ugradnje → proces i FAQ → kontakt.

## 4. Mobilni prvi ekran — obavezni popravak

Primarna akcija mora biti vidljiva pri 390 × 844, uz naslov, kratak opis i prepoznatljiv prikaz vrata. Na malim visinama osiguraj da naslov i akcija ostanu dostupni i da slika ne bude pretjerano odrezana.

Sadašnji mobile hero redom stavlja tekst pa cijelu sliku 1024/1536, uz margin-top -64px i akciju pri dnu. Zamijeni to kompozicijom koja se prilagođava stvarnoj visini ekrana:
- H1 oko 36–44 px kao početna smjernica, uz clamp i kontrolisano prelamanje.
- Jedna kratka rečenica umjesto dva duga opisa.
- Slika i tekst čine jednu scenu; tekst stoji u mirnoj zoni.
- Glavno dugme ne smije biti skriveno ispod cijele portretne slike.
- Koristi stabilne viewport jedinice uz fallback, safe-area i posebna pravila za mali ekran.
- Nemoj maskom ili negativnim marginama stvarati veliki prazan zid iznad vrata.
- Smanji dodatne informacije u hero sekciji i premjesti ih u naredni blok.

Testiraj 320, 360, 390, 430 px; 768, 1024, 1440 i 1920 px. Posebno landscape, povećan tekst i otvorenu tastaturu. Nema horizontalnog prelijevanja ili prekrivenih kontrola. Header oko 64–72 px; tap kontrole najmanje približno 44 px.

## 5. Pouzdan 3D viewer

Glavni fajlovi: src/components/ViewerPanel.tsx, src/three/DoorViewer.tsx, src/three/specs.ts, src/three/doorBuilder.ts, src/styles.css.

Implementiraj eksplicitna stanja viewera: photo, loading, ready, error. Svaka aktivacija i promjena proizvoda ima svoj identitet sesije da stari callback ne označi novi model spremnim.

Zaštita:
- Fotografija i naziv odabranog proizvoda uvijek su dostupan osnovni prikaz.
- Učitaj 3D na zahtjev na mobitelu. Desktop autostart je dopušten tek uz pouzdanu zaštitu.
- Ispravno provjeri WebGL 2 i oslobodi privremeni probni kontekst.
- ErrorBoundary, Canvas fallback i greške importovanja/resursa moraju vratiti fotografiju.
- Poster se uklanja tek poslije potvrde stvarnog prvog nacrtanog kadra. Montiranje komponente ili početak frame callbacka nije dovoljan dokaz vidljivog proizvoda.
- Pri aktiviranju, promjeni modela, ponovnom montiranju i dolasku u viewport resetuj spremnost i zatraži render.
- Obradi webglcontextlost, vraćanje i neuspješnu obnovu. U grešci ponovo prikaži fotografiju.
- Razumno ograniči čekanje, npr. približno 10 sekundi aktivnog učitavanja; ne računaj vrijeme dok je tab skriven ili viewer svjesno pauziran.
- Bez beskonačnih retry petlji. Ponovni pokušaj radi preko jasne korisničke akcije.
- Poruka bez tehničkog žargona: 3D trenutno nije dostupan. Nastavite s odabirom na fotografiji.
- Dugmad Otvori/Zatvori, Vrati pogled i zoom dostupna su tek kad postoje funkcionalan renderer i viewer API.
- Mode photo/3D, izabrani model i status moraju ostati usklađeni.

Raspored:
- Mobile viewer kao polazna mjera 280–360 px visine, zavisno od uređaja; cijela vrata vidljiva.
- Desktop viewer prati dostupan ekran, bez ogromnog praznog prostora.
- Roditelj ima jasno određenu veličinu; resize i promjena orijentacije ponovo uokviruju cijeli model.
- Vertikalno skrolanje telefona mora ostati prirodno. Povlačenje za okretanje ne smije zarobiti korisnika.
- Smanji DPR, sjene i skupe materijale na slabijim uređajima. Zadrži render na zahtjev gdje radi pouzdano.
- Testiraj skrol van viewera i nazad, photo→3D→photo→3D i vraćanje taba iz pozadine.

Geometrija i autentičnost:
- Modeli već imaju različite proceduralne specifikacije. Pregledaj svih 11 uz originalnu fotografiju.
- Krilo rotira oko osi baglama; kvaka ide zajedno s krilom; štok i zid ostaju nepomični.
- Klizna vrata kližu; dvokrilna otvaraju odgovarajuća krila.
- Vrata, kvake, lajsne i zid ne smiju se vidljivo presijecati.
- Model se pri promjeni vraća u zatvoren položaj.
- Fotografija se ne mijenja kad se izabere druga boja; jasno označi da je to original, a nova boja želja u specifikaciji.
- Stvarni fotorealistični GLB ne postoji u paketu. Ne tvrdi da si ga dobio dodavanjem proceduralne ploče.
- Ako neki model nije dovoljno vjeran, njegovu 3D ilustraciju ne predstavljaj kao tačan digitalni proizvod. Bolje jasno ograničen pregled i dobra fotografija.
- Unos mjere otvora nije ista mjera kao krilo. Bez odobrenih pravila ne radi lažnu proizvodnu simulaciju. Prikaži približne mjere kao informaciju za upit.

Dokumentacija: https://threejs.org/docs/pages/WebGLRenderer.html ; https://r3f.docs.pmnd.rs/api/canvas ; https://r3f.docs.pmnd.rs/advanced/scaling-performance

## 6. Konfigurator u tri koraka

1. Model i izgled: odabrani proizvod, kratki birač drugih modela, obrada, kvaka.
2. Mjere i prostorija: otvori, Ne znam mjere, količina, prostorija; debljina zida u dodatnim opcijama.
3. Pregled i ponuda: jasna fotografija/ilustracija i kompletna specifikacija.

Desktop: prikaz lijevo i kontrole koraka desno; vidljiva glavna akcija. Mobile: mali pregled proizvoda i jedan aktivni korak. Izbjegni višestruke unutrašnje scroll kontejnere.

Koraci pamte stanje. Nazad ne briše izbor. Greške su uz polje; fokus ide na prvu grešku. Ne znam mjere dozvoljava daljnji tok. Decimalni zarez radi. Nula, negativni unos, slova i nelogične jedinice se obrađuju jasnim porukama.

Boja/kvaka:
- Vizuelni uzorak, naziv i vidljivo stanje izbora.
- Opcije zasnivaj na podacima modela.
- Nepotvrđene opcije su želje za ponudu, ne obećane proizvodne mogućnosti.
- Jedno kratko objašnjenje dostupnosti umjesto stalnog ponavljanja dugih napomena.

Smjer otvaranja: dodaj mali precizan dijagram odozgo sa zidom, baglamom, kvakom i lukom otvaranja, usklađen s viewerom. Ne koristi generiranu ilustraciju koja može pogriješiti mehaniku. Sačuvaj Nisam siguran/na.

## 7. Katalog i slike

Odvoji modele od galerije ugradnji. Ujednači okvire, veličinu prikazanih vrata i tipografiju; ne deformiši izvorne slike. Kratki opis i direktno Odaberi model. Detalji su sekundarni.

Koristi postojeće fajlove iz public/images/madera; opt varijante su već pripremljene. Provjeri actual srcSet i naturalWidth/naturalHeight. Objekt-position podesiti po slici; ne odrezati baglame/kvaku/štok da bi svi izgledali isto.

| Fajl | Uloga na stranici |
|---|---|
| hero-hrast-desktop.png, optimizirane varijante | Desktop hero; puna scena, tekst u mirnoj lijevoj zoni |
| hero-hrast-mobile.png, optimizirane varijante | Mobile hero; kompozicija uređena prema visini ekrana |
| model-hrast-furnir-h.jpg | Hrast furnir H: katalog, izvorni poster, detalji |
| model-patras-bijeli.jpg | Patras: katalog, poster, detalji |
| model-olimpus-bijeli.jpg | Olimpus: ambijentalni prikaz; provjeriti koja su vrata predmet modela |
| model-milano-bijeli.jpg | Milano: katalog, poster, detalji |
| model-sara-bijeli.jpg | Sara: katalog, poster, detalji |
| model-anatolija-staklo.jpg | Anatolija: katalog, poster, detalji |
| izvedba-bijela-zlatni-detalji.jpg | Izvedba sa zlatnim detaljima; primjer ugradnje i vlastiti zapis |
| izvedba-dvokrilna-staklo-mreza.jpg | Dvokrilna izvedba; primjer, poster odgovarajućeg modela |
| izvedba-antracit-staklo-mreza.jpg | Tamna staklena izvedba; primjer i odgovarajući poster |
| izvedba-skrivena-siva.jpg | Skrivena vrata; primjer ravnine zida, poster |
| izvedba-klizna-staklo.jpg | Klizna izvedba; primjer i poster |
| logo-instagram.jpg | Izvorni identitet, samo gdje kvalitet odgovara veličini |

Hero je ilustracija ambijenta; katalog koristi originale. Sačuvaj kratku, jasnu napomenu. Ne preuzimaj tuđe produktne slike, kod ili GLB modele bez prava korištenja. Za eventualne nove produktne vizuale treba tačan referentni proizvod; ne zamijeniti ga izmišljenim izgledom.

Na mobitelu kompaktan pregled, jasno označene kategorije i lako proširenje ponude. Ne prikazuj 11 ogromnih kartica prije nego korisnik može nastaviti.

## 8. Planer / kalkulator i obuhvat upita

Dok nema odobrenih cijena:
- Istaknuti naslov Planer vrata za cijeli dom.
- Vidljiva oznaka Cijena na upit.
- Model, količina i mjesto su početna polja; mjere kroz jednostavan tok.
- Rezultat je pregled izbora, a ne lažna novčana procjena.

Kad je odobren cjenovnik stvarno popunjen:
- Aktivirati naziv Kalkulator izrade vrata.
- Pokazati osnovnu cijenu, doplate, broj vrata, montažu, dopremu i porezni prikaz.
- Nepoznata doplata/izvedba ide na upit; nikada ne postaje nula.
- Ne sabirati nepoznate troškove u lažno konačan ukupni iznos.

Popravi src/components/QuickCalculator.tsx:
- Obuhvat procjene, sažetka i upita mora biti isti.
- Akcija Ponuda za ova vrata koristi trenutni izbor.
- Akcija Ponuda za cijeli izbor (N vrata) koristi spremljene stavke.
- Jasno pokaži postoji li trenutni nespremljeni model; predloži dodavanje prije projekta.
- Ne dodaj vrata automatski više puta niti implicitno uključi drugu stavku.
- Test: projekt Milano 3 + trenutni Sara 1. Trenutni upit sadrži Sara 1; projektni upit Milano 3; nakon dodavanja Sare projekt ima 4 vrata.

## 9. Moj izbor i stvarni završetak

Sačuvaj dodavanje, edit, dupliranje, uklanjanje i obnovu iz localStorage. Nakon dupliranja olakšaj promjenu prostorije. Prikaži malu sliku, model, detalje, količinu i dimenzije. Kontaktni podaci ne ulaze u anonimni localStorage.

Smanji finalnu formu: ime, telefon, mjesto, poruka opcionalno, pregled specifikacije.
Ukloni Preuzmi JSON iz toka kupca. TXT može ostati sekundaran; pregled sa slikom za kupca je korisniji.

Odredište slanja mora biti stvarno potvrđeno. Ako postoje kredencijali i odredište u autoriziranom projektu, poveži odgovarajući server endpoint; tajne ne smiju biti u frontend bundleu. Potvrda uspjeha dolazi tek nakon valjanog odgovora servera. Obradi error/retry bez gubitka izbora. Zaštiti unos i sprečavanje duplog submit-a.

Ako endpoint ili potvrđeni kanal nedostaje, implementiraj pošteno pripremanje:
- Upit je pripremljen, još nije poslan.
- Kopiraj upit i Pozovi Maderu kao jasne akcije.
- Navedi u završnom izvještaju koji poslovni podatak nedostaje za stvarno slanje.
- Ne tvrdi da je slanje funkcionalno ako nije.
- WhatsApp se aktivira samo za potvrđeni poslovni kanal; ne pretpostavljaj da javni telefon ima WhatsApp.

Sticky mobile akcija ne pokriva polja, sliku ili tastaturu. Sakriti tokom otvorenog dijaloga i relevantnog unosa; provjeriti safe-area i landscape.

## 10. Šta uzeti iz međunarodnih primjera

Ove ideje su smjernice, ne nalog za kopiranje cijelog dizajna:
- TruStile: usporediv katalog i vizuelni izbor, zatim specifikacija/projekt.
- Ermetika: jasni koraci i postepeno traženje mjera.
- Lualdi: arhitektonsko kadriranje i miran raspored.
- heroal/redPlant: kvalitet materijala i povezivanje konfiguracije s upitom.
- Aurea/DirectPortes: stvarno različiti modeli sobnih vrata i njihovi detalji.
- OPPEIN Dubai: vidljiv i kratak put do poslovnog kontakta.

Granica: nisu svi njihovi 3D tokovi uspješno testirani u auditu. OPPEIN usluga 3D dizajna i 360° showroom nisu automatski interaktivni konfigurator proizvoda.

## 11. Provjera i završna isporuka

Pokreni postojeće testove, typecheck i build. Dodaj fokusirane testove samo za promijenjenu logiku: obuhvat draft/projekt, viewer stanja i relevantnu validaciju. Ne oslanjaj se na JSDOM kao dokaz rada GPU-a.

Vizuelno i funkcionalno provjeri:
- 320/360/390/430 mobile, tablet i desktop 1440/1920.
- Hero: vidljiva primarna akcija; vrata prepoznatljiva.
- Meni otvoren/zatvoren; linkovi i logo idu na tačnu sekciju.
- Katalog 6→11, svi filteri i detalji; promjena modela usklađuje stanje.
- Svi 3D modeli zatvoreni/otvoreni i oba podržana smjera, screenshot uz fotografiju.
- 3D aktivacija, loading, uspjeh, nedostupan WebGL 2, greška modela/importa i kontekst lost.
- Ponovljeno prebacivanje prikaza, viewport izlazak/povratak i orijentacija.
- Mjere poznate/nepoznate, decimalni zarez, quantity 0 i valjana količina.
- Projekt add/edit/duplicate/remove, refresh i konačni broj vrata.
- Draft/project scenario iz odjeljka 8.
- Galerija i FAQ, dijalozi, Escape, fokus i skrol.
- Finalna forma, copy/export i stvarna dostava samo kad je kanal konfiguriran.
- Tastatura ne prekriva akcije i ne stvara horizontalni scroll.

Test na stvarnom iOS Safariju je obavezan prije tvrdnje da je korisnikov problem riješen. Ako taj uređaj nije dostupan, jasno ga navedi kao preostalu provjeru; desktop responsive screenshot nije isto.

Sačuvaj screenshotove stvarne aplikacije: početni ekran, katalog, konfigurator foto/3D, namjerna greška, Moj izbor i finalni upit. Ne koristi generirane slike mockupa kao dokaz implementacije.

Završno isporuči: šta je promijenjeno, koji testovi su prošli, screenshotove, eventualni preview URL i konkretne preostale blokere. Stranica ne smije biti proglašena završenom dok je prazan viewer ili dvosmislen obuhvat upita prisutan.

