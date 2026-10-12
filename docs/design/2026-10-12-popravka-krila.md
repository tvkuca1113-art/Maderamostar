# Popravka animiranog krila

Na produkciji je direktni IMG element animiranog krila imao `max-width: 100%` iz općeg pravila za slike. Izmjerena širina bila je 249,719 px, jednaka roditelju, iako CSS traži 123,137% zbog prozirnih rubova teksture. Vidljiva desna ivica zato nije dosezala baglame. Promjena postavlja `max-width: none` samo za ovaj element. U lokalnom pregledniku isti element sada ima širinu 307,484 px, odnosno traženih 123,137% roditelja.

Izvor: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/max-width — maksimalna širina ograničava zadanu širinu. Provjeren je i https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style: grupirajuća svojstva mogu spljoštiti 3D potomke. Postojeći overflow na otvoru namjerno skriva krilo iza zida; u ovoj popravci nije promijenjen jer pregled međupoložaja pokazuje ispravno krilo sa fiksnom desnom ivicom nakon ispravke širine.

Provjera: produkcijski build prošao; postojeći integracijski test ulazne sekcije prošao. Vizuelno pregledani završetak otvaranja na desktopu i položaj krila od 60° u mobilnom okviru širine 390 px. Desna ivica ostaje uz štok, a otvor se pojavljuje lijevo. Mobilni okvir koristi Chrome; ovo nije test na fizičkom iPhoneu/Safariju. Interna QA stranica i izvorne PNG slike nisu dio objave.
