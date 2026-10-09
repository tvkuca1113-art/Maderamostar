# Mapa svih slika — Madera, verzija 2

U paketu su **dvije nove ambijentalne slike**, **11 originalnih fotografija vrata**, **originalni mali logo** i **jedna referenca odabranog izgleda**. Svaka fotografija proizvoda preuzeta je iz navedene javne Maderine objave i vizualno provjerena.

Putanje `public/images/madera/...` odnose se na datoteke projekta. U React/Vite aplikaciji web putanja je `/images/madera/...`; riječ `public` nije dio URL-a.

## Glavni prizor

| Datoteka | Dimenzije | Tačno mjesto | Sadržaj i način prikaza |
|---|---|---|---|
| `public/images/madera/hero-hrast-desktop.png` | 1672 × 941 | Hero na desktopu; po potrebi dekorativni završni prizor | Topli svijetli prostor, hrastova vrata desno, lijevo mirna ploha za stvarni HTML naslov. Kvaka je lijevo kao na originalnom proizvodu. Prikaži bez rezanja lajsni, kvake ili donjeg ruba. |
| `public/images/madera/hero-hrast-mobile.png` | 1024 × 1536 | Hero na telefonu, kroz art-directed `<picture>` | Isti vizualni smjer, uspravna kompozicija, gornji dio bez elemenata za naslov, cijela vrata dolje desno. Prikaži bez rezanja lajsni, kvake ili donjeg ruba. |

Obje slike su **AI ilustracije ambijenta prema originalnoj fotografiji Hrast furnir H**. Služe prezentaciji mogućeg interijera; ne predstavljaju fotografije izvedenog Maderinog projekta. U opisu ambijenta koristi „Ilustracija ambijenta”. Kvaka, rozeta, smjer godova i okvir uzeti su iz stvarne reference, ali slika nije proizvodni nacrt.

Na desktopu je tekst na lijevoj plohi, prije biljke; vrata su glavni motiv desno. Na telefonu naslov i kratki podnaslov idu iznad vrata u prazni gornji dio, a akcija može na donju podnu plohu ili odmah ispod slike. Nemoj utisnuti tekst u bitmap. Cijela slika mora ostati dostupna i u omjeru izvornika; za promjenu visine sekcije provjeri stvarni crop.

## Katalog i posebne izvedbe

Za kartice koristi uredan svijetli okvir i `object-fit: contain`. Fotografije imaju različite pozadine i uglove; to su originali. Lightbox prikazuje cijelu fotografiju. Ne obreži dio vrata da bi svaka kartica djelovala jednako i ne mijenjaj nijansu filterima.

| Datoteka | Dimenzije | Mjesto na stranici | Opis fotografije / važna napomena | Izvor |
|---|---|---|---|---|
| `public/images/madera/model-hrast-furnir-h.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru; galerija Naši radovi | Hrastova sobna vrata Hrast furnir H sa srebrnom kvakom. | [Objava](https://www.instagram.com/madera.mostar/p/CQ0VQmptcM7/) |
| `public/images/madera/model-patras-bijeli.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru | Bijela sobna vrata Patras s vodoravnim linijama. | [Objava](https://www.instagram.com/madera.mostar/p/CO5Q8mENEAC/) |
| `public/images/madera/model-olimpus-bijeli.jpg` | 1200 × 900 | Kartica modela, detalj modela, fotografija u konfiguratoru | Ugrađena bijela vrata Olimpus s ravnim lajsnama. Šira fotografija prikazuje više vrata i prostor; koristi cijeli original, bez tvrdnje da su sve vidljive kombinacije isti proizvod. | [Objava](https://www.instagram.com/madera.mostar/p/CO5y5HqtfyR/) |
| `public/images/madera/model-milano-bijeli.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru | Bijela sobna vrata Milano s diskretnim vodoravnim linijama. | [Objava](https://www.instagram.com/madera.mostar/p/CO5Rf94tj56/) |
| `public/images/madera/model-sara-bijeli.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru | Bijela vrata Sara s dvije profilirane pravougaone plohe. | [Objava](https://www.instagram.com/madera.mostar/p/CO5RXyBNUgL/) |
| `public/images/madera/model-anatolija-staklo.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru | Vrata Anatolija sa staklenim poljem i zakrivljenim gornjim rubom. Prikaz je iz montaže; zadrži original, bez tvrdnje da je ambijent završeni referentni projekt. | [Objava](https://www.instagram.com/madera.mostar/p/CP_AQO4N2rB/) |
| `public/images/madera/izvedba-bijela-zlatni-detalji.jpg` | 1440 × 1688 | Kartica modela, detalj modela, fotografija u konfiguratoru; galerija Naši radovi | Dvoja bijela sobna vrata sa zlatnim okomitim linijama i zlatnim kvakama. | [Objava](https://www.instagram.com/madera.mostar/p/DMIecy-NY_P/) |
| `public/images/madera/izvedba-dvokrilna-staklo-mreza.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru | Bijela dvokrilna vrata sa staklenim poljima, mrežom i crnom kvakom. Dva krila su odvojena, nemoj ih prikazivati kao jedno široko krilo. | [Objava](https://www.instagram.com/madera.mostar/p/Cj26lKMMmn4/) |
| `public/images/madera/izvedba-antracit-staklo-mreza.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru; galerija Naši radovi | Tamna jednokrilna vrata sa staklenim poljem podijeljenim mrežom. Tamna nijansa je vidljiva na fotografiji; tačan RAL kod nije objavljen. | [Objava](https://www.instagram.com/madera.mostar/p/C8FJ3WTtwhf/) |
| `public/images/madera/izvedba-skrivena-siva.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru; galerija Naši radovi | Siva skrivena sobna vrata u ravnini zida s crnom ručkom. Elektronska ručka na otisak prsta navedena je u opisu te objave, a nije automatski standard svih skrivenih vrata. | [Objava](https://www.instagram.com/madera.mostar/p/DH6TQoKs7LH/) |
| `public/images/madera/izvedba-klizna-staklo.jpg` | 1440 × 1800 | Kartica modela, detalj modela, fotografija u konfiguratoru | Klizna vrata sa staklenim poljima i uvučenim prihvatom. | [Objava](https://www.instagram.com/madera.mostar/p/CP567RRNR9Y/) |

## Brend i referenca za dizajn

| Datoteka | Dimenzije | Mjesto | Napomena |
|---|---|---|---|
| `public/images/madera/logo-instagram.jpg` | 150 × 150 | Footer; mali originalni brend element | Originalna profilna slika. Maksimalno približno 48–64 CSS px. Za veliki službeni logo potrebno je dobiti kvalitetan izvor. |
| `reference/verzija-2-odabrani-izgled.png` | 1448 × 1086 | Samo referenca za Claude Code | Odabrani izgled na laptopu i telefonu. Ne postaviti screenshot kao hero i ne preuzeti nacrtane inpute kao sliku. Implementirati stvarne HTML komponente. |

## Predloženi slijed slika na stranici

1. Desktop ili mobilna ambijentalna hero slika.
2. Katalog: Hrast furnir H → Patras → Olimpus → Milano → Sara → Anatolija.
3. Posebne izvedbe: bijela sa zlatnim detaljima → dvokrilna sa staklom → tamna sa staklom → skrivena → klizna.
4. Konfigurator: originalna fotografija trenutno izabranog zapisa kao poster ili referenca uz 3D ilustraciju.
5. Naši radovi: hrast, bijela sa zlatnim detaljima, tamna sa staklom i skrivena vrata; samo originali.
6. Footer: originalni mali logo.

Sve alt tekstove i tehničke podatke čitaj iz `data/asset-manifest.json`. Za dekorativnu pozadinu uz već opisani proizvod možeš koristiti prazan alt; dostupni opis prizora ostaje u sadržaju. Naziv datoteke ili izvor nije vidljivi alt tekst.
