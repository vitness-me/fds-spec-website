---
title: Ključ kategorije mišića
sidebar_label: Ključ kategorije mišića
description: Kako se strukturni ključ kategorije mišića (fxmg) sastavlja iz standardne anatomije i pokreta u zglobovima.
---

# Ključ kategorije mišića

Ključ kategorije mišića je strukturni ključ kategorije mišića. Nalazi se u polju `fxmg` i imenuje skup mišića koje ljudi zajedno treniraju i o kojima zajedno govore, kao što su mišići zadnje lože natkolenice, aduktori, fleksori kuka ili donji deo leđa. Ova stranica pokazuje kako se ključ sastavlja, koji su njegovi članovi i kako se dva ključa upoređuju.

Kategorija je definisana svojim članovima, a njeni članovi su uvek ključevi mišića. [Ključ mišića](./muscle-key.md) imenuje jedan mišić ili jedan deo. Ključ kategorije imenuje skup njih. Kao ni ključ mišića, nema sopstvene liste kodova: njegovi kodovi potiču iz anatomske reference i iz pokreta u zglobovima [ključa vežbe](./exercise-key.md). Kategorije izvedene do sada, sa svojim FMA i Uberon ID-jevima i svojim članovima, nalaze se u [`muscle-category-key.registry.json`](https://spec.vitness.me/registries/muscle-category-key.registry.json), a mišići koje sadrže u [`muscle-key.registry.json`](https://spec.vitness.me/registries/muscle-key.registry.json). Svaki ključ na ovoj stranici je ilustracija.

Ova stranica opisuje verziju 1.0 ključa kategorije mišića.

## Anatomija ključa {#anatomy-of-the-key}

Aduktori imaju ovaj ključ:

<figure className="key-anatomy">
  <div className="key-anatomy__key">
    <span className="key-anatomy__part">
      <code><span className="ka-code">FXMG</span><span className="ka-sym">=</span><span className="ka-code">1.0</span></code>
      <span className="key-anatomy__label">zaglavlje</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">/</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">thigh</span></code>
      <span className="key-anatomy__label">region</span>
    </span>
    <span className="key-anatomy__slash"><code><span className="ka-sym">.</span></code></span>
    <span className="key-anatomy__part">
      <code><span className="ka-code">medial</span></code>
      <span className="key-anatomy__label">odrednica</span>
    </span>
  </div>
  <figcaption>
    <span className="ka-code">kod</span> · <span className="ka-sym">simbol</span>
  </figcaption>
</figure>

`FXMG=1.0/thigh.medial`

| Deo | Tekst | Šta kaže |
|---|---|---|
| Tip ključa | `FXMG` | Ovo je ključ kategorije mišića. |
| Verzija | `1.0` | Glavna verzija 1, revizija 0. |
| Region | `thigh` | Natkolenica, po svom anatomskom terminu. |
| Odrednica | `medial` | Loža ili sloj regiona. Ovde medijalna loža natkolenice, koja sadrži aduktore. |

Zaglavlje i telo razdvojeni su znakom `/`. Ključ nema zastavicu `S` ili `N`, jer u njemu ništa nije prošireno. Zastavica napisana posle verzije izostavlja se iz zapisanog oblika.

## Četiri oblika {#the-four-forms}

Ključ imenuje jednu od četiri stvari.

| Oblik | Imenuje | Primer |
|---|---|---|
| `FXMG=1.0/<set>` | Skup ili region mišića koji anatomija imenuje | `FXMG=1.0/hamstring`, mišići zadnje lože natkolenice |
| `FXMG=1.0/<region>.<qualifier>` | Ložu ili sloj regiona | `FXMG=1.0/thigh.medial`, aduktori |
| `FXMG=1.0/a:<joint>.<action>` | Glavne pokretače jednog pokreta u zglobu | `FXMG=1.0/a:hip.flex`, fleksori kuka |
| `FXMG=1.0/<term>+<term>` | Sve što njeni termini pokrivaju. Termin je kategorija, mišić ili deo, a unija može imati i jedan termin | `FXMG=1.0/erector-spinae+quadratus-lumborum`, donji deo leđa; `FXMG=1.0/deltoid`, jedan mišić; `FXMG=1.0/trapezius.ascending`, jedan deo |

Pravila za svaki ključ:

- Ključ se piše tako što počinje sa `FXMG=1.0/`, a zatim sledi tačno jedan od četiri oblika.
- Svaki kod je malim slovima: slovo, pa slova i cifre, u rečima spojenim pojedinačnim crticama.
- Ključ ne nosi stranu, iz istog razloga iz kog je ne nosi ni ključ mišića.
- Članovi su uvek ključevi mišića. Kategorija nikada ne izmišlja kod za mišić.

## Anatomsko sidro {#the-anatomy-anchor}

Kodovi kategorija potiču iz iste reference kao i kodovi mišića: Foundational Model of Anatomy (FMA), verzija 5.1.0. FMA imenuje skupove mišića kao i pojedinačne mišiće, kao što su „Set of hamstring muscles“ i „Musculature of medial compartment of thigh“, i navodi njihove članove. Uberon vam pomaže da potvrdite da imate pravu strukturu, a kod uvek potiče iz FMA termina. Pogledajte [anatomsko sidro](./muscle-key.md#the-anatomy-anchor) na stranici o ključu mišića.

Uberon ima manje skupova od FMA. Ima quadriceps femoris, triceps surae i erector spinae, ali nema termin za većinu loža, za muskulaturu zadnjice ni za mišiće rotatorne manžetne. Njegov „rotator cuff“ je manžetna tetiva oko ramenog zgloba, a ne skup od četiri mišića, pa ga ne koristite za potvrdu koda `rotator-cuff`.

Anatomske reči nisu reči iz teretane, pa kategoriju potražite u FMA umesto da pišete reč iz teretane:

| Reč iz teretane | FMA termin | Kod |
|---|---|---|
| Gluteusi | Musculature of buttock | `buttock` |
| Listovi | Triceps surae | `triceps-surae` |
| Grudi | Pectoral musculature | `pectoral` |
| Potkolenice | Musculature of anterior compartment of leg | `leg.anterior` |

U FMA, „arm“ je samo nadlaktica, a „leg“ samo potkolenica. Uberon obe reči koristi za duže segmente, što je još jedan razlog da kod potiče iz FMA.

Za neke reči iz teretane FMA ima termin koji ne odgovara. FMA skupovi za leđa, donji ekstremitet i vrat obuhvataju mišiće na koje kategorija u teretani ne misli, pa su leđa, noge i vrat iz teretane unije, a ne FMA kodovi. Pogledajte [Kada termin ne postoji](#when-no-term-exists).

Registar kategorija navodi FMA i Uberon oznake i ID-jeve pod njihovim CC BY licencama: [Izvori i licence](./muscle-key.md#sources-and-licences) na stranici o ključu mišića navodi svaki izvor, njegovu verziju i njegovu licencu.

## Kod kategorije {#the-category-code}

Kod kategorije je FMA termin skupa, prepisan po pravilu ključa mišića:

1. Pronađite skup u FMA: „Set of …“, „Musculature of …“ ili grupu kao što je Quadriceps femoris. Uzmite njegov termin bez strane.
2. Izostavite „Set of“, „Musculature of“ i „musculature“, kao i reči „muscle“, „muscles“ i „muscle group“.
3. Kada ono što preostane glasi `<qualifier> compartment of <region>` ili `<qualifier> of <region>`, napišite `<region>.<qualifier>`. Odrednice idu od regiona ka spolja: „superficial muscles of posterior compartment of forearm“ je `forearm.posterior.superficial`.
4. Napišite ga malim slovima, sa rečima spojenim pojedinačnim crticama.

| FMA termin | Ključ |
|---|---|
| Set of hamstring muscles (FMA:81022) | `FXMG=1.0/hamstring` |
| Quadriceps femoris (FMA:22428) | `FXMG=1.0/quadriceps-femoris` |
| Triceps surae (FMA:51062) | `FXMG=1.0/triceps-surae` |
| Set of rotator cuff muscles (FMA:82650) | `FXMG=1.0/rotator-cuff` |
| Musculature of buttock (FMA:50230) | `FXMG=1.0/buttock` |
| Musculature of thigh (FMA:50208) | `FXMG=1.0/thigh` |
| Musculature of medial compartment of thigh (FMA:74149) | `FXMG=1.0/thigh.medial` |
| Set of intrinsic muscles of shoulder (FMA:33522) | `FXMG=1.0/shoulder.intrinsic` |
| Pectoral musculature (FMA:50223) | `FXMG=1.0/pectoral` |
| Musculature of anterior abdominal wall (FMA:78435) | `FXMG=1.0/anterior-abdominal-wall` |
| Set of superficial muscles of posterior compartment of forearm (FMA:39104) | `FXMG=1.0/forearm.posterior.superficial` |

Znak `.` znači isto u oba ključa: imenovani deo onoga što stoji ispred njega. U ključu mišića to je deo mišića, kao u `deltoid.acromial`. U ključu kategorije to je loža ili sloj regiona, kao u `thigh.medial`. Prvi kod vam kaže o čemu je reč: `deltoid` je mišić, a `thigh` je region.

## Članovi {#members}

Svaki kod ima skup članova, i poređenje radi nad njima. Članove anatomskog koda utvrđuje anatomska referenca, a članovi kategorije pokreta su glavni pokretači koje FDS za nju objavljuje u registru kategorija, pa svaki vlasnik dobija istu listu.

- **Skup ili loža** ima mišiće koje FMA navodi za svoj termin, zapisane kao ključevi mišića bez strane. `FXMG=1.0/hamstring` ima `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` i `FXM=1.0/semimembranosus`.
- **Skup može sadržati skupove.** Natkolenica sadrži quadriceps femoris, koji sadrži četiri mišića. Pratite članove naniže dok ne stignete do ključeva mišića.
- **Skup za koji FMA ne navodi članove** uzima ih iz Uberona. FMA ne navodi nijednog člana za erector spinae, pa su njegovi članovi tri mišića koje Uberon navodi kao njegove delove. Cela muskulatura, `FXMG=1.0/entire`, sadrži svaki mišić.
- **Pokret** ima glavne pokretače tog pokreta u zglobu, kako ih navodi [`muscle-category-key.registry.json`](https://spec.vitness.me/registries/muscle-category-key.registry.json). `FXMG=1.0/a:hip.flex` ima `FXM=1.0/psoas-major`, `FXM=1.0/iliacus` i `FXM=1.0/rectus-femoris`. Sartorius i tensor fasciae latae pomažu u fleksiji kuka, ali nisu glavni pokretači, pa nisu članovi. Postoji 40 kategorija pokreta, po jedna za svaki pokret u zglobu ključa vežbe osim everzije skočnog zgloba, `ank.ev`, pa `FXMG=1.0/a:ank.ev` nije ključ, a nijedna za kruženje.
- **Unija** ima sve što njeni termini pokrivaju. Termin je kod kategorije ili kod ključa mišića, sa delom ili bez njega.

Vlasnik koji misli na nešto drugo od FMA skupa, ili koji drugačije vidi glavne pokretače nekog pokreta, piše uniju. Nikada ne koristi taj kod sa sopstvenom listom članova. Vlasnik čiji fleksori kuka uključuju sartorius i tensor fasciae latae piše `FXMG=1.0/a:hip.flex+sartorius+tensor-fasciae-latae`.

Dva FMA termina mogu imati iste članove. `FXMG=1.0/hamstring` i `FXMG=1.0/thigh.posterior` (Musculature of posterior compartment of thigh, FMA:51036) oba sadrže tri mišića zadnje lože. Oba ključa su validna i porede se kao isti.

### Pisanje unije {#writing-a-union}

Unija se piše samo na jedan način, pa dva vlasnika koja misle na iste mišiće pišu isti tekst:

- Njeni termini sortirani su abecedno i svaki se pojavljuje jednom.
- Termin koji već pokriva neki drugi termin u ključu izostavlja se. `thigh+hamstring` se zapisuje kao `thigh`.
- Od dva termina koja pokrivaju iste mišiće ostaje onaj koji se sortira prvi. `thigh.posterior+hamstring` se zapisuje kao `hamstring`.
- Unija od jednog termina zapisuje se kao taj termin. „Ramena“ iz teretane koja znače samo deltoidni mišić su `FXMG=1.0/deltoid`.

Pošto unija meša kodove kategorija i kodove mišića, nijedan kod nikada nije oboje.

### Erector spinae

FMA svrstava erector spinae u skup mišića, Erector spinae muscle group (FMA:71302), pa je to kategorija: `FXMG=1.0/erector-spinae`. Njena tri člana su mišići sa sopstvenim ključevima: `FXM=1.0/iliocostalis` (FMA:77177), `FXM=1.0/longissimus` (FMA:77178) i `FXM=1.0/spinalis` (FMA:77179). FMA ne navodi članove za ovu grupu, pa oni potiču iz Uberona, koji ova tri navodi kao njene delove.

## Kada termin ne postoji {#when-no-term-exists}

- **Kategorija koju FMA ne imenuje, a koja nije jedan pokret u zglobu, jeste unija.** „Srednji deo leđa“ je `FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse`. „Trup“ nema dogovoreno značenje, pa svaki vlasnik piše uniju na koju misli, na primer `FXMG=1.0/anterior-abdominal-wall+erector-spinae+quadratus-lumborum`.
- **Kategorija čiji FMA skup seže predaleko takođe je unija.** FMA skupovi za leđa, donji ekstremitet i vrat sadrže mišiće na koje teretana ne misli tim rečima, kao što su mali mišići stopala u donjem ekstremitetu. Napišite mišiće na koje kategorija misli:

  | Reč iz teretane | Ključ |
  |---|---|
  | Leđa | `FXMG=1.0/deltoid.spinal+erector-spinae+latissimus-dorsi+quadratus-lumborum+rhomboid-major+rhomboid-minor+trapezius` |
  | Noge | `FXMG=1.0/a:hip.flex+buttock+hamstring+quadriceps-femoris+sartorius+tensor-fasciae-latae+thigh.medial+tibialis-anterior+triceps-surae` |
  | Vrat | `FXMG=1.0/semispinalis-capitis+splenius-capitis+sternocleidomastoid` |

- **Ime koje nije anatomija ne nosi ključ.** Lista kategorija ponekad sadrži stavke kao „kardio“ ili „ostalo“. Izostavite `fxmg` iz tih zapisa.

Ključevi su opcioni, pa je zapis bez ključa i dalje validan FDS.

## Šta šema ne može da proveri {#what-the-schema-cant-check}

Šema proverava samo zaglavlje, `FXMG=1.0/`. Encoder proverava ostatak ključa: jedan od četiri oblika i kodove malim slovima. Šema ne može da proveri da je kod ispravno izveden iz FMA termina, niti koji su članovi nekog koda.

Članovi skupa ili lože potiču iz FMA, pa svaki vlasnik koji prati pravilo dobija istu listu. Članovi pokreta ne potiču iz anatomije: oni su procena o tome koji mišići obavljaju najveći deo posla, a dva vlasnika mogu ih proceniti različito. Kod je zajednički, a neslaganje se pokazuje kao preklapanje kada se ključevi uporede.

## Razrađeni primeri {#worked-examples}

Svaki primer polazi od stavke kataloga i određuje ključ korak po korak.

### Zadnja loža {#hamstrings}

| Korak | Odluka |
|---|---|
| Termin | FMA ima Set of hamstring muscles (FMA:81022) |
| Kod | Izostavite „Set of“ i „muscles“: `hamstring` |
| Članovi | `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus`, `FXM=1.0/semimembranosus` |

`FXMG=1.0/hamstring`

### Aduktori {#adductors}

| Korak | Odluka |
|---|---|
| Termin | FMA ima Musculature of medial compartment of thigh (FMA:74149) |
| Kod | „medial compartment of thigh“ je loža: `thigh.medial` |
| Članovi | Pectineus, adductor longus, adductor brevis, adductor magnus, adductor minimus i gracilis, svaki kao svoj ključ mišića |

`FXMG=1.0/thigh.medial`

### Gluteusi {#glutes}

| Korak | Odluka |
|---|---|
| Termin | FMA ima Musculature of buttock (FMA:50230) |
| Kod | `buttock`, nikada `glutes` |
| Članovi | `FXM=1.0/gluteus-maximus`, `FXM=1.0/gluteus-medius`, `FXM=1.0/gluteus-minimus` |

`FXMG=1.0/buttock`

### Fleksori kuka {#hip-flexors}

| Korak | Odluka |
|---|---|
| Termin | FMA nema skup za fleksore kuka. Oni potiču iz trbuha, karlice i natkolenice |
| Kod | Mišići koji savijaju kuk: pokret u zglobu `hip.flex` iz ključa vežbe, zapisan kao `a:hip.flex` |
| Članovi | Glavni pokretači: `FXM=1.0/psoas-major`, `FXM=1.0/iliacus`, `FXM=1.0/rectus-femoris` |

`FXMG=1.0/a:hip.flex`

### Donji deo leđa {#lower-back}

| Korak | Odluka |
|---|---|
| Termin | FMA nema skup koji odgovara značenju iz teretane |
| Termini | Erector spinae, kategorija, i quadratus lumborum, mišić |
| Redosled | Sortirano: `erector-spinae`, pa `quadratus-lumborum` |

`FXMG=1.0/erector-spinae+quadratus-lumborum`

## Ključevi u zapisima {#keys-in-records}

Zapis kategorije mišića nosi svoj ključ u `fxmg`. Grupa kao što je „Zadnja loža“ je zapis kategorije, a ne zapis mišića:

```json fds:ignore muscle category record excerpt showing the fxmg field
{
  "schemaVersion": "1.1.0",
  "id": "cat.hamstrings",
  "fxmg": "FXMG=1.0/hamstring",
  "canonical": {
    "name": "Hamstrings",
    "slug": "hamstrings"
  },
  "metadata": {
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "status": "active"
  }
}
```

Ciljani mišići vežbe, primarni i sekundarni, uvek upućuju na pojedinačne mišiće, nikada na kategoriju. Svaka referenca na mišić zadržava `id` i `name` mišića, i nosi `categoryId` njegove kategorije, ključ mišića u `fxm` i ključ kategorije u `fxmg`. Vežba koja trenira zadnju ložu navodi tri mišića zadnje lože:

```json fds:ignore exercise record excerpt showing the fxm and fxmg fields
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

Zapis mišića zadržava svoj jedini `classification.categoryId`. To je jedna kategorija pod kojom vlasnik prikazuje mišić, a njen `fxmg` je onaj koji referenca nosi. Svaka druga kategorija kojoj mišić pripada izvodi se iz ključeva i nikada se ne čuva: rectus femoris je i u kvadricepsu i među fleksorima kuka, a referenca na njega nosi samo kategoriju koju je izabrao njen vlasnik.

## Poređenje dva ključa kategorije {#comparing-two-category-keys}

Poređenje gleda mišiće i delove koje svaki ključ pokriva kada se njegovi članovi isprate naniže do ključeva mišića.

- **Isti**: dva ključa pokrivaju iste mišiće i delove.
- **Specifičniji**: jedan ključ pokriva deo onoga što pokriva drugi, i ništa van toga.
- **Preklapanje**: dele neke mišiće, a svaki pokriva neki koji drugi ne pokriva.
- **Različit**: dva ključa nemaju nijedan zajednički mišić ili deo.

| Ključ A | Ključ B | Rezultat |
|---|---|---|
| `FXMG=1.0/hamstring` | `FXMG=1.0/hamstring` | Isti |
| `FXMG=1.0/hamstring` | `FXMG=1.0/thigh.posterior` | Isti: dva FMA termina sa ista tri člana |
| `FXMG=1.0/thigh.medial` | `FXMG=1.0/thigh` | A je specifičniji: loža regiona B |
| `FXMG=1.0/external-oblique+internal-oblique` | `FXMG=1.0/anterior-abdominal-wall` | A je specifičniji |
| `FXMG=1.0/triceps-surae` | `FXMG=1.0/pectoral` | Različit |
| `FXMG=1.0/quadriceps-femoris` | `FXMG=1.0/a:hip.flex` | Preklapanje: oba sadrže rectus femoris |

Tri poređenja rade samo na osnovu teksta: identični ključevi su isti, loža ili sloj je specifičniji od svog regiona, a unija je specifičnija od unije koja sadrži sve njene termine i još nešto. Za sve ostalo potrebni su članovi svakog koda.

### Mišić u kategoriji {#a-muscle-in-a-category}

Ključ mišića i ključ kategorije porede se sopstvenim rečima:

- **U**: sve što ključ mišića pokriva nalazi se u kategoriji. `FXM=1.0/semitendinosus` je u `FXMG=1.0/hamstring`.
- **Delimično u**: nalazi se deo toga. `FXM=1.0/trapezius` je delimično u srednjem delu leđa, `FXMG=1.0/rhomboid-major+rhomboid-minor+trapezius.ascending+trapezius.transverse`, koji sadrži samo dva dela trapeznog mišića.
- **Nije u**: ne nalazi se ništa od toga.

Mišić može biti u više kategorija. `FXM=1.0/rectus-femoris` je u `FXMG=1.0/quadriceps-femoris` i u `FXMG=1.0/a:hip.flex`.

## Pronalaženje srodnih stavki {#finding-related-items}

Kategorije su definisane svojim članovima, pa pronalaze jedna drugu, svoje mišiće i vežbe koje ih treniraju, bez ijedne deklarisane veze.

| Pretraga | Pronalazi |
|---|---|
| Mišić, `FXM=1.0/biceps-femoris` | Svaku kategoriju u kojoj se nalazi: `hamstring`, `thigh.posterior`, `thigh`, `entire`, `a:hip.ext` i `a:kn.flex` |
| Kategorija, `FXMG=1.0/hamstring` | Njene mišiće: `FXM=1.0/biceps-femoris`, `FXM=1.0/semitendinosus` i `FXM=1.0/semimembranosus` |
| Kategorija koja sadrži samo neke delove mišića, srednji deo leđa | Te delove: `FXM=1.0/trapezius.ascending` i `FXM=1.0/trapezius.transverse`, pored dva romboidna mišića |
| Region, `thigh` i `thigh.*` | Natkolenicu i njene lože, baš kao što `biceps-brachii.*` pronalazi glave jednog mišića |
| Pokret vežbe, `m:hip.ext+kn.ext` | `FXMG=1.0/a:hip.ext` i `FXMG=1.0/a:kn.ext`, a preko njih gluteus maximus, mišiće zadnje lože i kvadriceps |
| Vežbe čiji je ciljani `fxm` u `FXMG=1.0/hamstring` | Svaku vežbu koja trenira zadnju ložu, pod kojom god kategorijom ih koji katalog vodi |

Pokret u zglobu u ključu vežbe i pokret kategorije su isti kod, pa vežba vodi pravo do mišića koje trenira, kao što njen kod opterećenja vodi do ključa njene opreme.

Da biste uparili kategorije dva kataloga, uporedite njihove ključeve. „Donji deo leđa“ jednog kataloga je `FXMG=1.0/erector-spinae+quadratus-lumborum`, a „Erektori kičme“ drugog su `FXMG=1.0/erector-spinae`. Drugi je specifičniji: prvi sadrži i quadratus lumborum.

Da biste mišiće jednog kataloga grupisali pod njegove sopstvene kategorije, smestite svaki ključ mišića u svaki ključ kategorije. `FXM=1.0/longissimus` je u `FXMG=1.0/erector-spinae`, a `FXM=1.0/trapezius` je delimično u srednjem delu leđa.

## Građenje ključeva {#building-keys}

Ključ možete napisati ručno prateći ovu stranicu ili ga generisati alatom [FDS Encoder](../../tools/encoder/index.md).
