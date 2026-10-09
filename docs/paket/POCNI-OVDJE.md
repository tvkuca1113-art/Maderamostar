# Madera — odabrana verzija 2

Ovaj paket daje Claude Codeu odabrani vizual, gotov tekst stranice, fotografije, katalog i pravila za funkcionalni konfigurator i kalkulator.

## Kako koristiti

1. Raspakuj cijeli ZIP i otvori mapu `Madera-Verzija-2` u Claude Codeu ili je stavi uz postojeći projekt.
2. Kopiraj cijeli tekst iz `CLAUDE-CODE-SUPERPROMPT.md` u Claude Code. Osiguraj da Claude ima pristup mapi sa slikama i podacima; ako je paket u podmapi, navedi mu tu putanju.
3. Claude treba izraditi i provjeriti desktop i mobilni prikaz, povezani katalog, stvarni 3D demonstracijski viewer, kalkulator i upit.

**Kratka početna uputa ako paket stavljaš u postojeći repo:**

> Pročitaj `Madera-Verzija-2/CLAUDE-CODE-SUPERPROMPT.md` i implementiraj ga u ovom projektu. Koristi priloženu mapu slika i podatke. Prvo pregledaj postojeći repo i sačuvaj njegovu funkcionalnost. Dovrši i vizualno provjeri cijeli tok na desktopu i telefonu.

## Sadržaj

- `CLAUDE-CODE-SUPERPROMPT.md` — kompletna uputa za implementaciju.
- `MAPA-SLIKA.md` — opis i položaj svake slike.
- `PONUDA-VRATA.md` — šest imenovanih modela i pet posebnih izvedbi.
- `public/images/madera/` — dvije nove hero slike, 11 originalnih fotografija vrata i mali originalni logo.
- `data/` — proizvodi, slike, poslovne postavke i prazna struktura cjenovnika.
- `reference/` — odabrani izgled, istraživanje i indeks 50 Instagram objava.

## Kako radi kalkulator

S trenutnim podacima kupac bira vrata i priprema specifikaciju za ponudu. Unos potvrđenog cjenovnika omogućava novčanu procjenu. Kontakt sada koristi pripremljeni upit, kopiranje, preuzimanje i potvrđeni telefon. Slanje obrasca se uključuje kad postoji stvarni kanal za prijem.

**3D modeli nisu priloženi.** Prompt traži stvarnu ilustrativnu 3D geometriju s ispravnom mehanikom i pripremljenom mogućnošću zamjene potvrđenim modelima. Originalne fotografije služe kao dokaz izgleda proizvoda.

Hero slike prikazuju AI ambijent prema originalnom Hrast furnir H. Galerija Naši radovi koristi originalne fotografije iz profila. Imenovane modele iz starijih objava treba potvrditi za aktuelni katalog.
