---
title: Specifikacije (RFC dokumenti)
description: Svaki FDS RFC — normativni dokumenti koje objavljene šeme implementiraju
---

# FDS specifikacije

Standard je specifikovan u RFC dokumentima, po jedan za svaki model podataka. RFC je normativni
dokument: on kaže šta entitet znači, čemu služe njegova polja i šta usaglašen
dokument mora da zadovolji — objavljena JSON šema je ta
specifikacija učinjena mašinski proverljivom.

Stranice u ovom odeljku su kopije izvora iz direktorijuma
`specification/rfc/` u repozitorijumu, bajt za bajt. CI poredi svaku stranicu sa
njenim izvorom pri svakoj izmeni, tako da je ono što ovde čitate upravo ono što standard kaže.

<!-- fds:count rfcs=8 -->
Objavljeno je 8 RFC dokumenata:

<!-- fds:covers rfcs -->
| RFC | Specifikuje |
|---|---|
| [RFC-001 — Model podataka o vežbi](/docs/specifications/rfc-001-exercise-data-model) | Entitet vežbe: identitet, klasifikacija, ciljni mišići i metrike. |
| [RFC-002 — Model podataka o opremi](/docs/specifications/rfc-002-equipment-data-model) | Entitet opreme: šta je mašina ili sprava, iskazano pojmovima po kojima drugi sistem može da postupa. |
| [RFC-003 — Model podataka o mišiću](/docs/specifications/rfc-003-muscle-data-model) | Entitet mišića: vokabular anatomije koji vežbe ciljaju. |
| [RFC-004 — Model podataka o kategoriji mišića](/docs/specifications/rfc-004-muscle-category-data-model) | Entitet kategorije mišića: grupacije u koje se mišići objedinjuju. |
| [RFC-005 — Model podataka o atlasu tela](/docs/specifications/rfc-005-body-atlas-data-model) | Entitet atlasa tela: imenovani regioni koje svaki prikazivač može da nacrta na svoj način. |
| [RFC-006 — Primitivi preskripcije](/docs/specifications/rfc-006-prescription-primitives) | Biblioteka definicija preskripcije: opterećenje, ponavljanja, odmor i tempo kao delovi za višekratnu upotrebu. Koren njene šeme po dizajnu ne validira ništa. |
| [RFC-007 — Model podataka o treningu](/docs/specifications/rfc-007-workout-data-model) | Entitet treninga: kako je trening strukturiran. |
| [RFC-008 — Model podataka o programu treninga](/docs/specifications/rfc-008-program-data-model) | Entitet programa: višenedeljni planovi koji upućuju na treninge umesto da ih iznova iskazuju. |

Svaki RFC imenuje verziju šeme koja ga implementira. Za to koje verzije
entiteta objavljuje tekuće izdanje, pogledajte
[pregled JSON šema](/docs/schemas/) — i imajte na umu da se entiteti verzionišu
nezavisno: izdanje imenuje *skup* verzija entiteta, a ne jednu verziju
koju svi dele.
