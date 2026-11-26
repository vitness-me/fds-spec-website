---
title: Strukturni ključevi
sidebar_position: 1
---

# Strukturni ključevi

Strukturni ključ je kratak string koji opisuje vežbu, komad opreme, mišić ili kategoriju mišića po onome što jeste. Zapisuje se kodovima koje standard objavljuje, a ne imenima nekog kataloga. Dva kataloga koja istu vežbu zovu različitim imenima mogu da uporede ključeve i pronađu jedan drugog.

## Problem sa imenima {#the-problem-with-names}

Katalozi danas pronalaze zapise jedan drugog po imenu, a imena loše putuju.

- Jedna vežba ima mnogo imena. „Pregib sa bučicama“, „stojeći pregib za biceps“ i „biceps sa bučicama“ su isti pokret, a teretana za njega može imati i svoje kućno ime.
- Imena se menjaju sa jezikom. „Pregib sa bučicom“, „Dumbbell curl“ i „Curl con mancuerna“ su ista vežba, a katalog na srpskom to ne može da zna.
- Jedno ime može značiti više stvari. „Veslanje“ može biti veslanje na sajli, veslanje sa šipkom ili trening na spravi za veslanje.

Uparivanje po imenu svodi se na sličnost stringova, prevođenje i nagađanje, i svaki par kataloga ponavlja taj posao. Kada neko pređe u drugu aplikaciju, njegova istorija treninga stiže vezana za imena koja nova aplikacija možda ne prepoznaje.

## Šta je strukturni ključ {#what-a-structural-key-is}

Ključ opisuje samu stvar. Sastoji se od slojeva, a svaki sloj beleži jednu dimenziju stvari kodovima sa lista koje standard objavljuje. Vlasnik koji opisuje pregib sa bučicama u stojećem stavu piše ovaj ključ, kako god da njegov katalog zove vežbu:

`FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`

Čita se kao fleksija lakta, u stojećem stavu, sa bučicom u rukama. Srpski i engleski katalog mogu da napišu isti ključ, jer ključ ne zavisi od imena ni u jednom od njih.

FDS objavljuje kako se ključevi grade i liste kodova iz kojih se uzimaju. Ne objavljuje ključeve za zapise nijednog kataloga, jer je FDS standard, a ne katalog. Za mišiće i kategorije mišića, lista kodova je sama anatomija. Svaki vlasnik piše ključeve za sopstvene zapise.

## Šta ključevi omogućavaju {#what-keys-make-possible}

- **Uparivanje među katalozima.** Upoređujete ključeve umesto imena. Poređenje dva ključa kaže vam da su isti, da je jedan specifičniji od drugog, da se preklapaju (nijedan nije specifičniji i ništa ne protivreči) ili da su različiti. Stranice o ključevima opisuju finije slučajeve.
- **Interoperabilnost.** Dve platforme mogu da povežu svoje kataloge bez prethodnog dogovora o imenima i bez usvajanja zajedničke liste.
- **Istorija koja preživi prelazak.** Kada neko promeni aplikaciju, nova aplikacija može svaku zabeleženu vežbu da pronađe u sopstvenom katalogu po ključu, pa istorija ostaje upotrebljiva.

### Pronalaženje srodnih stavki {#finding-related-items}

Ključevi koji dele kodove čine porodice, a nijedan odnos ne mora nigde da se deklariše. Potražite zajednički kod i naći ćete celu porodicu:

- **Isti pokret.** Vežbe čiji je pokret `hip.ext+kn.ext`, kukovi i kolena koji se zajedno opružaju, čine porodicu čučnjeva i iskoraka, kako god ih koji katalog zvao.
- **Ista vrsta opreme.** Vežbe opterećene bilo kojim kodom `bell.*` su rad sa bučicama, girjama i cirkuskim bučicama.
- **Sve sprave za snagu.** Ključevi opreme sa `k:mac` su sve sprave za snagu. Ključ vežbe spravu za snagu imenuje kao `mac`, pa se vežbe na njima pronalaze na isti način.
- **Svi delovi jednog mišića.** `FXM=1.0/biceps-brachii` i ključevi koji mu dodaju deo, kao `FXM=1.0/biceps-brachii.long`, jesu mišić i njegove glave.
- **Mišići jedne kategorije.** `FXMG=1.0/hamstring` sadrži `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` i `FXM=1.0/semimembranosus`, a vežba čiji je pokret `hip.flex` vodi do `FXMG=1.0/a:hip.flex`, mišića koji savijaju kuk.

Svaka stranica o ključu pokazuje kako se pretražuju njegovi slojevi.

## Šta ključevi ne rade {#what-keys-dont-do}

- **Ključ nije identifikator.** Identitet zapisa je `id` njegovog vlasnika, kao i do sada. Dva vlasnika koja opisuju istu vežbu ne pišu uvek isti ključ: jedan može zabeležiti više detalja ili drugačije protumačiti pokret. Ključ pronalazi kandidate. Ne dokazuje da su dva zapisa ista.
- **Ključ ne govori ništa o preskripciji.** Tempo, opterećenje, serije i ponavljanja pripadaju [primitivima preskripcije](../specifications/rfc-006-prescription-primitives) i treninzima.
- **Ključ ne zamenjuje imena.** Imena, alijasi i prevodi ostaju u zapisu. Ključ stoji pored njih.

Ključevi su opcioni. Zapis bez ključa je i dalje validan FDS.

## Četiri ključa {#the-four-keys}

| Model     | Polje | Šta opisuje                                        | Primer                                    |
|-----------|-------|----------------------------------------------------------|--------------------------------------------|
| Vežba  | `fxi` | Kako se telo kreće, njegov položaj i čime se kreće | `FXI=1.0S/m:el.flex/o:standing/l:bell.dumb@hands`, pregib sa bučicama u stojećem stavu |
| Oprema | `fxe` | Koja je vrsta opreme i njen oblik                | `FXE=1.0S/k:imp/f:bar.ez`, EZ šipka        |
| Mišić    | `fxm` | Mišić i, gde ih ima, njegovi delovi             | `FXM=1.0/biceps-brachii.long`, duga glava mišića biceps brachii |
| Kategorija mišića | `fxmg` | Skup mišića, po anatomiji, po pokretu u zglobu ili kao unija njih i pojedinačnih mišića ili delova | `FXMG=1.0/hamstring`, mišići zadnje lože natkolenice |

Ista polja pojavljuju se i svuda gde zapis upućuje na vežbu, mišić ili komad opreme preko ID-ja i imena, pa se i reference mogu uparivati na isti način. Referenca na mišić nosi oba: `fxm` mišića i `fxmg` njegove kategorije.

## Korišćenje ključeva {#using-keys}

Da biste povezali dva kataloga, uporedite ključeve njihovih zapisa i prikupite kandidate. Identičan ključ je pouzdano poklapanje. U suprotnom, osoba bira pravi zapis sa kratke liste. Svaku potvrđenu vezu čuvajte u sopstvenim podacima, u `attributes` ili `extensions`, da niko ne bi morao ponovo da je traži. Ključeve možete pisati ručno, prateći obrazac sastavljanja svakog ključa, ili ih generisati alatom [FDS Encoder](../tools/encoder/index.md).

## Kuda dalje {#where-to-go-next}

- [Ključ vežbe](./structural-keys/exercise-key.md): kako je građen `fxi`, njegove dimenzije i kodovi.
- [Ključ opreme](./structural-keys/equipment-key.md): kako je građen `fxe`.
- [Ključ mišića](./structural-keys/muscle-key.md): kako je građen `fxm`.
- [Ključ kategorije mišića](./structural-keys/muscle-category-key.md): kako je građen `fxmg`.
- [FDS Encoder](../tools/encoder/index.md): gradite, proveravajte, upoređujte i uparujte ključeve za sopstvene zapise.
