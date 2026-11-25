---
title: 'Strukturni deskriptori: FXI, FXE i FXM'
sidebar_label: 'Pregled'
description: 'Nacrt strukturnih deskriptora za vežbe, opremu i mišiće: šta su, šta FDS objavljuje i odakle početi sa ručnim kodiranjem'
sidebar_position: 1
---

# Strukturni deskriptori: FXI, FXE i FXM

:::caution Nacrt
Ove stranice opisuju nacrt. Ništa ovde nije normativno dok se ne prihvati [RFC-010](/docs/specifications/rfc-010-structural-descriptors), koji usvaja strukturne deskriptore. RFC-010 je nacrt, a [njegov §12](/docs/specifications/rfc-010-structural-descriptors#12-open-items) navodi uslove za njegovo prihvatanje. Vokabulari se verzionišu revizijom pravila, odvojeno od šema entiteta. Izdanje 1.6.0, predloženo uz RFC-010, nosi ova polja u vežbi 1.2.0, opremi 1.2.0 i mišiću 1.1.0; objavljuje se kada RFC-010 bude prihvaćen.
:::

Strukturni deskriptor je kratak string koji kaže kako se vežba izvodi, šta je komad opreme ili na koji se mišić misli, zatvorenim vokabularom umesto rečima. Dva kataloga koja istu vežbu opisuju na različitim jezicima, pod različitim nazivima, ipak mogu da napišu isti deskriptor, a softver može da uporedi ta dva stringa bez čitanja ijednog naziva.

| Deskriptor | Opisuje | Izgleda ovako |
|---|---|---|
| **FXI** | Vežbu: njen pokret, položaj tela, oslonac, opterećenje, strane, hvat, obim pokreta, zadržani položaj i liniju vuče. | `FXI=1.0S/m:hip.ext+kn.ext/o:standing/l:bb@back` |
| **FXE** | Komad opreme, po njegovoj strukturi: vrstu, oblik, a za spravu i njen interfejs opterećenja, položaj i vođeni pokret. | `FXE=1.0S/k:mac/l:hand/s:seat/m:pull.back` |
| **FXM** | Mišić, deo mišića ili grupu mišića, usidrene u otvorenu anatomsku ontologiju. | `FXM=1.0/latissimus-dorsi` |

Prvi primer je zadnji čučanj sa šipkom; drugi je sprava na kojoj se izvodi veslanje na sajli u sedu.

## Šta deskriptor jeste, a šta nije {#what-a-descriptor-is-and-what-it-is-not}

FXI je **deskriptor**, a ne identitet. Deterministički je na dva načina: isti odgovori uvek grade isti string, a ista dva stringa uvek se porede na isti način. To ne znači da dve osobe koje opisuju istu vežbu svaki put napišu isti string. Ljudi opcione detalje navode različito, a vokabular ne može da kaže sve.

Zato ovaj standard tvrdi tačno ovo: **deterministički deskriptor i poređenje; automatsko podudaranje na jedinstvenim identičnim ključevima; inače potvrda jednim klikom; potvrđena veza se čuva.**

- Dva stringa koja se porede kao `identical` opisuju istu strukturu. Poređenje nikada ne prijavljuje dva različita stringa kao identična.
- Kada biblioteka sadrži tačno jedan unos identičan upitu, i na obe strane su odgovarali njihovi vlasnici, a nijedna ne nosi marker nedostatka, softver može da ih poveže bez pitanja.
- Inače nudi kratku rangiranu listu koju osoba potvrđuje, i čuva potvrđenu vezu.

Redovi pročitani iz drugog kataloga, bez njegovog vlasnika (režim uvoza), služe samo za pretragu kandidata. Ovaj standard ne iznosi nikakvu tvrdnju o njihovoj tačnosti, i nikada se ne povezuju bez osobe.

## Šta FDS objavljuje, a šta ne {#what-fds-publishes-and-what-it-does-not}

FDS je standard, a ne katalog. Objavljuje:

- **sintaksu** svakog stringa, njegov kanonski oblik i pravila koja određuju svaki sloj;
- **vokabulare klasifikatora**: zglobne akcije, orijentacije, tačke tela, simetriju, hvat i stav, obim pokreta, zadržane položaje i linije vuče za FXI; vrste, oblike, pogone, interfejse, položaje, smerove, cikluse i putanje za FXE. Nalaze se u [`specification/registries/descriptors/`](https://github.com/vitness-me/fds-spec-website/tree/main/specification/registries/descriptors);
- **tok pitanja**: zatvorena pitanja čiji odgovori grade FXI i FXE, ispisana tako da osoba može na njih da odgovori ručno;
- **poređenje**, **protokol podudaranja** i **verzionisanje**.

Ne objavljuje:

- **reči pokreta.** Reč pokreta („čučanj“, „veslanje“) je prečica koja odjednom fiksira uobičajeno tumačenje svakog sloja. Reči su podaci kataloga: enkoder učitava skup podataka reči pokreta, a tok pitanja kaže gde se on uključuje. I bez njega svaka vežba može da se kodira, opisivanjem njenog pokreta zglob po zglob. Reč koju je vlasnik izabrao nikada ne putuje u stringu; čuva se u zapisu odgovora, gde je razrešivač može koristiti kao nagoveštaj za rangiranje;
- **listu mišića.** FXM određuje format ključa, način na koji se ključ sidri i šta grupa znači. Koji mišići i grupe postoje stvar je provajderovog vokabulara;
- **katalog opreme.** FXE klasifikuje strukturu. Unosi opreme jednog provajdera nose FXE stringove; FDS ne navodi proizvode ni modele.

## Polja koja zapis nosi {#the-fields-a-record-carries}

Zapis koji nosi FXI uz njega nosi i sledeće:

| Polje | Sadrži |
|---|---|
| `fxi` | Kanonski FXI. |
| `fxe` | Kanonski **standardni** FXE glavne opreme zapisa (`FXE=1.0S/…`). Prošireni FXE slojevi pojavljuju se samo u zapisu opreme u registru. |
| `fxiProvenance` | Ko je odgovorio za FXI: `owner`, `owner-assisted`, `agent` ili `import`. Pogledajte [RFC-010 §5.3](/docs/specifications/rfc-010-structural-descriptors#53-fxiprovenance-and-fxigap). |
| `fxiGap` | Vlasnikova beleška u običnom tekstu o tome šta notacija propušta u vezi sa ovom vežbom, ili `null`. Marker nedostatka blokira automatsko podudaranje. |

Potvrđene veze između kataloga čuvaju se u nizu `xrefs`, a svaki unos imenuje drugi katalog (`system`), zapis u njemu (`id`) i način na koji je veza napravljena (`link`: `auto` ili `confirmed`). Zapis opreme nosi sopstveni `fxe`, a zapis mišića svoj `fxm`. [RFC-010](/docs/specifications/rfc-010-structural-descriptors) §5 definiše gde svako polje stoji na entitetima vežbe, opreme i mišića, i zašto se `xrefs` drži odvojeno od `metadata.externalRefs`.

## Ručno kodiranje: odakle početi {#encoding-by-hand-where-to-start}

1. Pročitajte jednom stranicu [FXI](./fxi.md), radi oblika stringa i značenja svakog sloja.
2. Prođite [tok pitanja](./question-flow.md) od vrha. Svako pitanje kaže kada se postavlja i koji kod upisuje svaki odgovor. Bez skupa podataka reči pokreta, za pokret odgovorite `other` i opišite pokret zglob po zglob.
3. Sastavite string prema [pravilima izgradnje](./question-flow.md#from-answers-to-strings), a zatim ga svedite na [kanonski oblik](./fxi.md#canonical-form).
4. Za opremu pratite granu opreme u istom toku, ili [FXE postupak](./fxe.md#procedure).
5. Da biste utvrdili da li dva stringa opisuju istu stvar, koristite [poređenje](./compare-and-match.md#compare).

Tok pitanja se završava [razrađenim primerima](./question-flow.md#worked-examples): zadnjim čučnjem sa šipkom, veslanjem na sajli u sedu i spravom za veslanje na sajli u sedu.

## Stranice {#pages}

| Stranica | Obuhvata |
|---|---|
| [FXI](./fxi.md) | Deskriptor vežbe: sintaksu, podrazumevane vrednosti, pravilo izvora, pravila slojeva i svaki kod. |
| [Tok pitanja](./question-flow.md) | Svako pitanje, kada se postavlja, šta upisuje svaki odgovor i kako odgovori postaju stringovi. |
| [FXE](./fxe.md) | Deskriptor opreme: vrste, slojeve, postupak i svaki kod. |
| [FXM](./fxm.md) | Ključ mišića: format, sidrenje i značenje grupa. |
| [Poređenje, podudaranje i verzionisanje](./compare-and-match.md) | Relacije između stringova, protokol podudaranja, poreklo, marker nedostatka i način na koji se revizije pravila razvijaju. |
| [Usaglašenost](./conformance.md) | Vektore testova koje svaka implementacija prolazi, u četiri nivoa, i izmerene izveštaje uz njih. |
