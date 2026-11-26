---
title: Ključ mišića
sidebar_label: Ključ mišića
description: Kako se strukturni ključ mišića (fxm) sastavlja iz standardne anatomije.
---

# Ključ mišića

Ključ mišića je strukturni ključ mišića. Nalazi se u polju `fxm` i imenuje jedan mišić ili jedan deo mišića, rečima preuzetim iz standardne anatomije. Ova stranica pokazuje kako se ključ sastavlja, odakle potiču njegovi kodovi i kako se dva ključa upoređuju.

Ključ mišića je jednostavniji od ključa vežbe. Nema slojeve ni sopstvene liste kodova. Njegovi kodovi potiču iz anatomske reference, pa FDS objavljuje pravilo za njihovo izvođenje. Kodovi izvedeni do sada, svaki sa svojim FMA ID-jem, nalaze se u [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json). Svaki ključ na ovoj stranici je ilustracija.

Skup mišića, kao mišići zadnje lože natkolenice ili fleksori kuka, jeste kategorija mišića i ima sopstveni ključ: pogledajte [ključ kategorije mišića](./muscle-category-key.md).

Ova stranica opisuje verziju 1.0 ključa mišića.

## Anatomija ključa {#anatomy-of-the-key}

Duga glava mišića biceps brachii ima ovaj ključ:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXM</span><span className="ka-sym">=</span><span className="ka-code">1.0</span></code>
      <span className="key-anatomy__label">zaglavlje</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">biceps-brachii</span></code>
      <span className="key-anatomy__label">mišić</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">.</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">long</span></code>
      <span className="key-anatomy__label">deo</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-code">kod</span> · <span className="ka-sym">simbol</span>
  </figcaption>
</figure>

`FXM=1.0/biceps-brachii.long`

| Deo | Tekst | Šta kaže |
|---|---|---|
| Tip ključa | `FXM` | Ovo je ključ mišića. |
| Verzija | `1.0` | Glavna verzija 1, revizija 0. |
| Mišić | `biceps-brachii` | Mišić, po svom anatomskom terminu. |
| Deo | `long` | Duga glava tog mišića. |

Zaglavlje i telo razdvojeni su znakom `/`. Ključ mišića nema zastavicu `S` ili `N`, jer u njemu ništa nije prošireno. Zastavica napisana posle verzije izostavlja se iz zapisanog oblika, pa se `FXM=1.0S/biceps-brachii` zapisuje kao `FXM=1.0/biceps-brachii`.

## Dva oblika {#the-two-forms}

Ključ imenuje jednu od dve stvari.

| Oblik | Imenuje | Primer |
|---|---|---|
| `FXM=1.0/<muscle>` | Ceo mišić | `FXM=1.0/biceps-brachii`, biceps brachii |
| `FXM=1.0/<muscle>.<part>` | Deo ili glavu mišića | `FXM=1.0/deltoid.acromial`, akromijalni deo deltoidnog mišića, koji se u teretani zove bočni deltoid |

Pravila za svaki ključ:

- Ključ se piše tako što počinje sa `FXM=1.0/`, a zatim sledi tačno jedan od dva oblika.
- Svaki kod je malim slovima: slovo, pa slova i cifre, u rečima spojenim pojedinačnim crticama.
- Ključ ne nosi stranu. Leva i desna strana pripadaju vežbi, u njenom sloju strana `x`. Zapis za levi biceps i zapis za desni oba nose `FXM=1.0/biceps-brachii`.

## Anatomsko sidro {#the-anatomy-anchor}

Anatomija već ima standardna imena. Foundational Model of Anatomy (FMA) daje svakom mišiću, kao i imenovanim delovima i glavama mišića, jedan fiksan termin i identifikator. Ključ mišića usidren je za taj termin. Kodovi na ovoj stranici izvedeni su iz FMA verzije 5.1.0. Vlasnik ne izmišlja kod mišića: pronalazi mišić u FMA i izvodi kod iz termina koji nađe. Dva vlasnika koja potraže isti mišić dobijaju isti termin, pa pišu isti kod, kako god njihovi katalozi zvali mišić i na kom god jeziku.

Uberon je druga anatomska referenca koja pokriva iste mišiće pod sopstvenim identifikatorima. Pomaže vam da potvrdite da imate pravu strukturu. Često ima ceo mišić, ali ne i njegove glave ili delove, a kod uvek potiče iz FMA termina.

Obe reference možete pretraživati u servisu EBI Ontology Lookup Service: [FMA](https://www.ebi.ac.uk/ols4/ontologies/fma) i [Uberon](https://www.ebi.ac.uk/ols4/ontologies/uberon). [Projekat Uberon](https://obophenotype.github.io/uberon/) ima sopstvenu dokumentaciju. Ove veze su informativan putokaz: ključ ostaje validan i ako se sajt premesti.

### Izvori i licence {#sources-and-licences}

Registar mišića, [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json), i registar kategorija, [`muscle-category-key.registry.json`](https://spec.vitness.me/registries/muscle-category-key.registry.json), navode oznake i identifikatore iz dve reference, bez izmena. Svaki registar imenuje svoje izvore u `sources` i `attribution`.

| Izvor | Verzija | Licenca |
|---|---|---|
| [Foundational Model of Anatomy Ontology (FMA)](http://si.washington.edu/projects/fma), Structural Informatics Group, University of Washington | 5.1.0 | [CC BY 3.0 Unported](https://creativecommons.org/licenses/by/3.0/) |
| [Uberon](http://uberon.org), the Uber-anatomy ontology, OBO Foundry | izdanje 2026-11-05 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |

Kodovi su sopstveni kodovi FDS-a, napisani iz FMA oznaka. Svako ko ponovo objavljuje oznake ili ID-jeve iz registara zadržava ovo navođenje i vezu ka licenci.

## Kod mišića {#the-muscle-code}

Kod mišića je FMA termin, prepisan:

1. Pronađite mišić u FMA i uzmite njegov preferirani termin, na primer `Latissimus dorsi`.
2. Uzmite termin bez strane. FMA ima i termine kao „Right deltoid“, a taj mišić je `deltoid`.
3. Napišite ga malim slovima.
4. Izostavite reč „muscle“ tamo gde je termin ima.
5. Preostale reči spojite pojedinačnim crticama: `latissimus-dorsi`.

| FMA termin | Kod mišića |
|---|---|
| Biceps brachii | `biceps-brachii` |
| Latissimus dorsi | `latissimus-dorsi` |
| Pectoralis major | `pectoralis-major` |
| Gluteus maximus | `gluteus-maximus` |
| Semitendinosus | `semitendinosus` |
| Longissimus | `longissimus` |

Svakodnevno ime mišića ne menja njegov kod. „Latovi“ su `latissimus-dorsi`, a isto važi i za „lats“ u engleskom katalogu i „dorsal ancho“ u španskom.

FMA termin za skup mišića nije mišić. Erector spinae muscle group je kategorija, `FXMG=1.0/erector-spinae`, a njeni članovi su mišići: `FXM=1.0/iliocostalis`, `FXM=1.0/longissimus` i `FXM=1.0/spinalis`.

## Delovi {#parts}

Kod dela je reč kojom FMA razlikuje deo ili glavu od ostatka mišića: reč ispred „part of“ ili „head of“ u njegovom terminu.

| FMA termin | Ključ |
|---|---|
| Long head of biceps brachii | `FXM=1.0/biceps-brachii.long` |
| Short head of biceps brachii | `FXM=1.0/biceps-brachii.short` |
| Acromial part of deltoid | `FXM=1.0/deltoid.acromial` |
| Clavicular part of pectoralis major | `FXM=1.0/pectoralis-major.clavicular` |
| Medial head of gastrocnemius | `FXM=1.0/gastrocnemius.medial` |

Pravila:

- Deo se piše posle svog mišića, spojen znakom `.`. Deo nikada ne stoji sam, jer je `long` glava mišića biceps brachii, ali i mišića triceps brachii.
- Deo pišite samo tamo gde se trenira drugačije od ostatka mišića. Gornji deo grudi je klavikularni deo mišića pectoralis major i zaslužuje sopstveni zapis. Mišić koji se trenira kao jedna celina dobija jedan zapis i nema delove.
- Delovi mišića zajedno čine ceo mišić. `FXM=1.0/biceps-brachii` pokriva dugu i kratku glavu.

## Kada termin ne postoji {#when-no-term-exists}

Pravilo nikada ne traži od vas da nagađate.

- **Deo bez termina uzima najmanju strukturu koja ga sadrži.** FMA imenuje dugu glavu mišića biceps brachii, ali ne „gornji biceps“ ili „donji deo grudi“. Upotrebite najmanju strukturu koju FMA imenuje, a koja sadrži onu na koju mislite. Donji deo grudi je `FXM=1.0/pectoralis-major.abdominal`. Gornji biceps obuhvata obe glave, pa je `FXM=1.0/biceps-brachii`. Svaki ključ je tačan, iako manje specifičan. Nikada ne koristite užu strukturu nego što dokazi podržavaju.
- **Skup mišića nije mišić.** „Zadnja loža“, „trup“ ili „celo telo“ obuhvataju više mišića. Takvo ime je kategorija mišića i nosi [ključ kategorije mišića](./muscle-category-key.md) u `fxmg`, a ne `fxm`.
- **Ime koje nije anatomija ne nosi ključ.** Lista mišića ponekad sadrži stavke kao „kardio“, „olimpijska dizanja“ ili „ostalo“. Izostavite `fxm` iz tih zapisa.

Ključevi su opcioni, pa je zapis bez ključa i dalje validan FDS.

## Šta šema ne može da proveri {#what-the-schema-cant-check}

Šema proverava samo zaglavlje, `FXM=1.0/`. Encoder proverava ostatak ključa: jedan od dva oblika i kodove malim slovima spojene crticama. Šema ne može da proveri da je kod mišića ispravno izveden iz FMA termina, niti da kod dela imenuje deo koji FMA ima.

To je cena objavljivanja pravila umesto liste. Dva vlasnika mogu napisati različite ključeve za jedan mišić i oba ključa prolaze šemu. Jedan vlasnik čita FMA i za bočni deltoid piše `FXM=1.0/deltoid.acromial`. Drugi se ravna po nazivu iz teretane i piše `FXM=1.0/deltoid.lateral`. Oba ključa su dobro formirana, poređenje kaže da su različiti, a samo osoba koja proveri FMA termin može da kaže koji prati pravilo. Doslednim izvođenjem ključevi različitih vlasnika se susreću.

## Razrađeni primeri {#worked-examples}

Svaki primer polazi od stavke kataloga i određuje ključ korak po korak.

### Biceps

Katalog navodi „Biceps“.

| Korak | Odluka |
|---|---|
| Termin | FMA termin je Biceps brachii |
| Kod | Mala slova, crtice: `biceps-brachii` |
| Deo | Stavka označava ceo mišić, pa nema dela |

`FXM=1.0/biceps-brachii`

### Duga glava bicepsa {#long-head-of-the-biceps}

Katalog navodi „Biceps, duga glava“ kao zasebnu stavku.

| Korak | Odluka |
|---|---|
| Mišić | Biceps brachii: `biceps-brachii` |
| Deo | FMA termin je Long head of biceps brachii, pa je kod dela `long` |

`FXM=1.0/biceps-brachii.long`

### Bočni deltoidi {#side-delts}

Katalog navodi „Bočni deltoidi“.

| Korak | Odluka |
|---|---|
| Termin | Bočna strana ramena u FMA je akromijalni deo deltoidnog mišića |
| Mišić | Deltoid: `deltoid` |
| Deo | Acromial part of deltoid: `acromial`, a ne reč iz teretane „lateralni“ |

`FXM=1.0/deltoid.acromial`

### Erektori kičme {#erector-spinae}

Katalog navodi „Erektori kičme“ i „Najduži mišić leđa“ kao dve stavke.

| Korak | Odluka |
|---|---|
| Termin | FMA ima Erector spinae muscle group, skup mišića, i Longissimus, mišić |
| Erektori kičme | Skup je kategorija: stavka postaje zapis kategorije sa `FXMG=1.0/erector-spinae` u svom `fxmg`. Zapis mišića nikada ne nosi `fxmg` |
| Najduži mišić leđa | Mišić: `longissimus` |

`FXM=1.0/longissimus`

### Latovi {#lats}

Katalog navodi „Latovi“.

| Korak | Odluka |
|---|---|
| Termin | Svakodnevno ime odnosi se na mišić čiji je FMA termin Latissimus dorsi |
| Kod | `latissimus-dorsi`, nikada `lats` |

`FXM=1.0/latissimus-dorsi`

## Ključevi u zapisima {#keys-in-records}

Zapis mišića nosi svoj ključ u `fxm`, a isto važi i za svaku referencu na mišić, kao što su ciljani mišići vežbe:

```json fds:ignore muscle record excerpt showing the fxm field
{
  "schemaVersion": "1.1.0",
  "id": "mus.bicepsBrachiiLongHead",
  "fxm": "FXM=1.0/biceps-brachii.long",
  "canonical": {
    "name": "Biceps Brachii, Long Head",
    "slug": "biceps-brachii-long-head",
    "aliases": ["Outer Biceps"]
  },
  "classification": {
    "categoryId": "cat.upperArmFront",
    "region": "upper-front",
    "laterality": "bilateral"
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

Ciljani mišići vežbe, primarni i sekundarni, uvek upućuju na pojedinačne mišiće, nikada na kategoriju. Svaka referenca na mišić zadržava `id` i `name` mišića, i nosi `categoryId` njegove kategorije, ključ mišića u `fxm` i ključ kategorije u `fxmg`. Vežba koja trenira zadnju ložu navodi tri mišića zadnje lože:

```json fds:ignore exercise record excerpt showing the fxi, fxm and fxmg fields
{
  "exerciseId": "ex.romanianDeadlift",
  "fxi": "FXI=1.0S/m:hip.ext/o:standing/l:bar.straight@hands",
  "canonical": { "name": "Romanian Deadlift", "slug": "romanian-deadlift" },
  "targets": {
    "primary": [
      { "id": "mus.bicepsFemoris", "name": "Biceps Femoris", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/biceps-femoris", "fxmg": "FXMG=1.0/hamstring" },
      { "id": "mus.semitendinosus", "name": "Semitendinosus", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/semitendinosus", "fxmg": "FXMG=1.0/hamstring" },
      { "id": "mus.semimembranosus", "name": "Semimembranosus", "categoryId": "cat.hamstrings", "fxm": "FXM=1.0/semimembranosus", "fxmg": "FXMG=1.0/hamstring" }
    ],
    "secondary": [
      { "id": "mus.gluteusMaximus", "name": "Gluteus Maximus", "categoryId": "cat.glutes", "fxm": "FXM=1.0/gluteus-maximus", "fxmg": "FXMG=1.0/buttock" }
    ]
  }
}
```

## Poređenje dva ključa mišića {#comparing-two-muscle-keys}

Poređenje gleda mišiće i delove koje svaki ključ pokriva. Deo pokriva sebe, a mišić pokriva sve svoje delove.

- **Isti**: dva ključa su zapisana identično.
- **Specifičniji**: jedan ključ je deo mišića koji drugi imenuje.
- **Različit**: dva ključa nemaju nijedan zajednički mišić ili deo.

| Ključ A | Ključ B | Rezultat |
|---|---|---|
| `FXM=1.0/biceps-brachii` | `FXM=1.0/biceps-brachii` | Isti |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii` | A je specifičniji: duga glava je jedan deo mišića |
| `FXM=1.0/biceps-brachii.long` | `FXM=1.0/biceps-brachii.short` | Različit: dve glave jednog mišića |
| `FXM=1.0/biceps-brachii` | `FXM=1.0/brachialis` | Različit: dva mišića |

Ključevi mišića porede se samo na osnovu teksta. Za poređenje mišića sa kategorijom pogledajte [Mišić u kategoriji](./muscle-category-key.md#a-muscle-in-a-category).

Isti ključevi su pouzdano poklapanje, a sve ostalo daje kratku listu koju osoba potvrđuje. Pogledajte [Korišćenje ključeva](../structural-keys.md#using-keys) za to kako se čuvaju potvrđene veze.

## Pronalaženje srodnih stavki {#finding-related-items}

Ključ mišića vodi do njegovih delova, do kategorija kojima pripada i do vežbi koje ga treniraju. Nijedna veza ne mora nigde da se deklariše.

| Pretraga | Pronalazi |
|---|---|
| `FXM=1.0/deltoid` i `FXM=1.0/deltoid.*` | Deltoidni mišić i njegova tri dela: `clavicular`, `acromial` i `spinal` |
| `FXM=1.0/biceps-brachii.*` | Dugu i kratku glavu mišića biceps brachii |
| Mišić, `FXM=1.0/rectus-femoris`, u indeksu kategorija | Svaku kategoriju u kojoj se nalazi: `quadriceps-femoris`, `thigh.anterior`, `thigh`, `entire`, `a:hip.flex` i `a:kn.ext` |
| Deo, `FXM=1.0/deltoid.acromial`, u indeksu kategorija | `shoulder.intrinsic`, `entire` i `a:sh.abd`, glavne pokretače abdukcije ramena |
| Pokret vežbe, `m:hip.flex` | `FXMG=1.0/a:hip.flex`, čiji su članovi `FXM=1.0/psoas-major`, `FXM=1.0/iliacus` i `FXM=1.0/rectus-femoris` |
| Ciljani mišići vežbi čiji je `fxm` jednak `FXM=1.0/gluteus-maximus` | Svaku vežbu koja trenira gluteus maximus, u bilo kom katalogu |

`deltoid.*` označava svaki ključ koji dodaje deo na `deltoid`. Indeks kategorija navodi, za svaki mišić i deo, svaku kategoriju čiji ga članovi sadrže. Gradi se iz članova kategorija, pa zapis mišića ništa od toga ne čuva. Pogledajte [Pronalaženje srodnih stavki](./muscle-category-key.md#finding-related-items) na stranici o ključu kategorije mišića. Pokret u zglobu u ključu vežbe je kod jedne kategorije pokreta, pa pokret vežbe vodi do mišića koji ga izvode.

## Građenje ključeva {#building-keys}

Ključ možete napisati ručno prateći ovu stranicu ili ga generisati alatom [FDS Encoder](../../tools/encoder/index.md).
