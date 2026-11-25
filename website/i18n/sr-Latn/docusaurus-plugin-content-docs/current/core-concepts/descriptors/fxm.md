---
title: 'FXM: ključ mišića'
sidebar_label: 'FXM (mišići)'
description: 'Nacrt formata FXM ključa, sidrenja u ontologiju i značenja grupa'
sidebar_position: 5
---

# FXM: ključ mišića

:::caution Nacrt
Nije normativno dok se ne prihvati [RFC-010](/docs/specifications/rfc-010-structural-descriptors), koji usvaja strukturne deskriptore. RFC-010 je nacrt. Pogledajte [pregled](./overview.md).
:::

FXM imenuje mišić, deo mišića ili grupu mišića, tako da dva kataloga koja isti mišić zovu različito, na različitim jezicima, mogu da utvrde da misle na isto tkivo.

FDS određuje format ključa, način na koji se ključ sidri u anatomiju i šta grupa znači. **Ne objavljuje listu mišića ni grupa.** Koje mišiće provajder imenuje, koje delove izdvaja i koje grupe definiše stvar je vokabulara tog provajdera, objavljenog uz njegov katalog mišića. Pravila u nastavku čine vokabulare dva provajdera uporedivim.

## Format {#format}

```text
FXM=1.0/<muscle>              a whole anatomical muscle
FXM=1.0/<muscle>.<part>       a part or head of a muscle
FXM=1.0/g:<group>             a group, defined by its members
```

- `1` je glavna verzija, a `0` revizija sintakse; obe se uvek pišu. FXM nema proširenih slojeva, pa njegovo kanonsko zaglavlje ne nosi oznaku `S` ni `N`; napisana oznaka se prihvata i odbacuje.
- Svaki token je u malim slovima, u kebab-case obliku: slovo, zatim slova i cifre, u rečima spojenim pojedinačnim crticama.
- Ključ ne nosi stranu. Leva i desna strana pripadaju vežbi (FXI `x`), a ne mišiću.

Ilustrativni ključevi, iz vokabulara jednog provajdera, a ne iz ovog standarda: `FXM=1.0/latissimus-dorsi`, `FXM=1.0/deltoid.acromial`, `FXM=1.0/g:hamstrings`.

## Sidrenje {#anchoring}

Svaki mišić i svaki deo usidren je u otvorenu anatomsku ontologiju, tako da ključ znači strukturu, a ne reč.

1. **FMA je primarna.** Svaki mišić i deo nosi termin iz Foundational Model of Anatomy za tu strukturu (`FMA:<id>`, sa oznakom termina onako kako je FMA piše).
2. **UBERON je unakrsna referenca.** Tamo gde UBERON ima termin za istu strukturu, nosi se i on (`UBERON:<id>`).
3. **Termin koji nedostaje je navedena praznina, nikada nagađanje.** Tamo gde ontologija nema termin za strukturu (UBERON često ima ceo mišić, ali ne i njegove glave), unos beleži tu prazninu rečima, imenujući ono što ontologija ima umesto toga. Sidro se nikada ne pozajmljuje od šire ili uže strukture.

**Tokeni slede sidro.** Token mišića izvodi se iz preferirane oznake njegovog FMA termina: napišite je malim slovima, uklonite reči „muscle group“, ili inače reč „muscle“, i preostale reči spojite pojedinačnim crticama (`Latissimus dorsi` je `latissimus-dorsi`, `Erector spinae muscle group` je `erector-spinae`). Token dela je kvalifikator u FMA oznaci dela ili glave, reč ispred „part of“ ili „head of“ (`Clavicular part of deltoid` je `clavicular`, `Long head of biceps brachii` je `long`). Dva provajdera koja strukturu usidre u isti FMA termin zato za nju pišu isti ključ, a čitalac može da razreši ključ mišića ili dela iz FMA bez provajderovog vokabulara. Token grupe se ne izvodi: on je provajderov sopstveni (pogledajte [grupe](#groups-are-member-sets)).

**Delovi postoje samo tamo gde se različito treniraju.** Mišić sa delovima je tačno unija svojih delova: u celom mišiću nema tkiva koje nijedan deo ne pokriva.

Svaki unos vokabulara zato nosi: svoj token, naziv za prikaz, svoja sidra (sistem, CURIE, oznaku) i, tamo gde ontologija nema termin, prazninu.

## Grupe su skupovi članova {#groups-are-member-sets}

Grupa je definisana **FXM ključevima svojih članova**, nikada svojim nazivom. Članovi mogu biti mišići, delovi ili druge grupe.

- Grupa znači skup anatomskih listova koje njeni članovi pokrivaju: deo je sam svoj list; mišić sa delovima je svi njegovi delovi; mišić bez delova je sam svoj list; grupa je unija listova svojih članova.
- Dva ključa sa istim listovima znače isto tkivo, kako god da se zovu. Grupa i mišić mogu biti identični.
- Grupa ima bar jednog člana, svaki član je važeći kanonski ključ u istom vokabularu, i nijedna grupa ne sadrži samu sebe preko drugih grupa.
- Grupa može da nosi i sidro u ontologiji, tamo gde ontologija ima termin tačno za taj skup.

Dva provajdera mogu grupu da imenuju različito i ipak da se slože oko njenog značenja, jer se poređenje vrši nad listovima, a ne nad nazivima. Ključ `g:` razrešava se samo kroz vokabular provajdera koji ga je definisao, a ključ ne kaže koji je to provajder.

## Poređenje {#compare}

Dva FXM ključa porede se prema anatomskim listovima koje svaki od njih pokriva:

| Stepen | Kada |
|---|---|
| `identical` | Isti listovi. |
| `contains` | Jedan pokriva svaki list drugog, i još neke. Stepen imenuje stranu koja sadrži drugu. |
| `overlaps` | Neki listovi su zajednički, a nijedan ključ ne sadrži drugi. |
| `disjoint` | Nijedan list nije zajednički. |

Poređenje ključeva iz dva vokabulara zahteva oba vokabulara, jer listovi grupe dolaze iz lista članova njenog provajdera. Ključevi čiji su listovi usidreni u iste termine ontologije opisuju isto tkivo u svim vokabularima.

## Validacija {#validation}

FXM je važeći kada mu je zaglavlje `FXM=1.0/`, telo jedan od tri gornja oblika, a vokabular prema kome se proverava ima taj mišić, taj deo tog mišića ili tu grupu. Validacija se uvek vrši prema imenovanom vokabularu: format može da se proveri sam, a postojanje tokena ne može.

<!-- Open in RFC-010 §12: where a provider publishes its FXM vocabulary, and the entry shape. The reference encoder's `--muscles` input is the working shape. -->
