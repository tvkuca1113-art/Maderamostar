# Madera: ponuda prije planera

## Cilj

Posjetilac mora vidjeti vrste vrata i konkretne modele prije unosa mjera i količine. Početna scena ostaje interaktivna, ali jedan običan skrol vodi u ponudu. Nema dugog obaveznog uvoda.

Redoslijed: početna → kolekcije i modeli → konfigurator → planer cijelog doma → spremljeni izbor → stvarni radovi → način saradnje → pitanja i kontakt.

## Provjerene službene reference, 12. oktobar 2026.

Ovo je izbor relevantnih primjera, a ne objektivna rang-lista najboljih stranica.

| Izvor | Primjena na Maderu |
|---|---|
| [TruStile, USA](https://www.trustile.com/interior-doors) | Pregled kategorija i modela, odvojeni prikaz opcija i projektnog konfiguratora. |
| [TruStile alati](https://www.trustile.com/) | Veza između inspiracije, vizualizacije i izbora vrata. |
| [Simpson, USA](https://www.simpsondoor.com/door-styles/interior/) | Jasni putevi do konkretnih vrsta vrata. |
| [Simpson design tools](https://www.simpsondoor.com/design-tools/) | Prilagođavanje kao korak nakon istraživanja proizvoda. |
| [Lualdi, Italija](https://www.lualdiporte.com/en/categories_products/doors/) | Arhitektonska fotografija, pregled proizvoda, filteri materijala i otvaranja. |
| [Rimadesio, Italija](https://www.rimadesio.it/en/product-category/doors/) | Razdvajanje klasičnih, skrivenih i kliznih sistema. |
| [ADL, Italija](https://adldesign.it/en/) | Predstavljanje kolekcija kroz prostor i materijale; trenutni direktni dohvat početne imao je grešku, službeni indeks bio je dostupan. |
| [ECLISSE UK](https://www.eclisse.co.uk/blogs/blog/home-trends-for-2025-seamlessly-integrating-eclisse-syntesis-flush-pocket-and-hinged-doors) | Jasno pokazati smisao skrivenih i kliznih vrata u prostoru. |

Aktuelni sadržaj referenci provjeren je pretragom i službenim stranicama. Postojeći snimci Lualdija i TruStilea iz ranijeg audita korišteni su za vizuelnu podlogu, bez tvrdnje da su snimljeni danas.

## Instagram i stvarna ponuda

Originalne fotografije i raniji pregled 50 Maderinih objava ostaju u `docs/paket/reference/instagram-50-objava.json`. Tokom ovog rada veza preglednika prvo je prestala odgovarati, zatim se oporavila. Profil je ponovo otvoren kroz potvrđenu prijavljenu sesiju @podlezve: 50 objava, ista lokacija i kontakt, pregledan najnoviji prikaz fotografija i dostupni opisi novih bijelih i ostakljenih izvedbi. To nije novi pregled svake fotografije u svih 50 karusela.

Na početnoj se koristi nova ilustracija ambijenta zasnovana na originalnim bijelim vratima s tri zlatne vertikalne lajsne. U kolekcijama, katalogu i radovima ostaju originalne Maderine fotografije. Cijene i dostupnost potvrđuje Madera; ne dodavati izmišljene cijene, recenzije ili garancije.

## Novi asseti i animacija

`public/images/madera/entry-v3/hero-desktop-*` i `hero-mobile-*`: novi ambijent, dostupne AVIF i WebP veličine. `door-leaf.webp`: zasebno krilo; ručica je zaseban SVG sloj. Izvori su proizvedeni ugrađenim imagegen alatom, a web verzije optimizovane Sharpom.

Prompt: arhitektonska fotografija mat bijelih Maderinih vrata s tri uske zlatne lajsne i zlatnom kvakom lijevo, desne baglame, svijetli mushroom zid, orašasti parket i drvena obloga skroz desno; mirna zona za HTML tekst, bez biljke, klupe, prozora u prvom planu, UI-ja ili loga. Desktop i mobilni kadar komponovani zasebno.

Otvaranje je prostorna CSS animacija sa fizičkom debljinom krila, zasebnom kvakom i portalom u salon. Nije novi fotorealistični WebGL model. Postojeći 3D konfigurator ostaje zaseban alat s fotografskim rezervnim prikazom.
