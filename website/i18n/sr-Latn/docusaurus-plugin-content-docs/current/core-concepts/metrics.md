---
title: Metrike
sidebar_position: 1
---

# Vodič za uparivanje metrika

Ovaj vodič precizira važeće i preporučene parove tipa i jedinice metrike, kao i očekivanja po tipu vežbe, radi doslednosti među implementacijama.

Šema vežbe ograničava *strukturu* polja `metrics` i pripadnost vrednosti `type` i `unit` njihovim enumima. Ona **ne** ograničava koja jedinica ide uz koji tip — `{"type": "reps", "unit": "kg"}` je validno po šemi, a besmisleno. Upravo to uparivanje ovaj vodič utvrđuje.

## Važeći parovi tip/jedinica

### Merenje

| Tip         | Dozvoljene jedinice                              | Napomene                           |
|-------------|--------------------------------------------------|------------------------------------|
| `reps`      | `count`                                          | Celi brojevi                       |
| `weight`    | `kg`, `lb`                                       | Preferirajte jedan sistem po skupu podataka |
| `duration`  | `s`, `min`, `ms`                                 | Sekunde radi preciznosti; `ms` za rad ispod sekunde (merenje vremena po ponavljanju ili po fazi u treningu zasnovanom na brzini) |
| `distance`  | `m`, `km`, `mi`                                  |                                    |
| `speed`     | `m_s`, `km_h`                                    | Kretanje celog tela po podlozi     |
| `pace`      | `min_per_km`, `min_per_mi`                       |                                    |
| `power`     | `W`                                              |                                    |
| `heartRate` | `bpm`                                            |                                    |
| `steps`     | `count`                                          |                                    |
| `calories`  | `kcal`                                           | Procenjeno                         |
| `height`    | `cm`, `in`                                       | Za skokove/visinu kutije           |
| `velocity`  | `m_s`                                            | Brzina šipke ili sprave, ne sportiste. Različito od `speed` |

### Napor i intenzitet

| Tip                 | Dozvoljene jedinice | Napomene                                                     |
|---------------------|---------------|--------------------------------------------------------------|
| `rpe`               | `count`       | Skala 1–10                                                    |
| `rir`               | `count`       | Ponavljanja u rezervi, 0–10. Inverz `rpe`; ne mešajte ta dva u istom skupu podataka bez beleženja koji je korišćen |
| `percent1RM`        | `percent`     | U odnosu na maksimum za jedno ponavljanje, koji MOŽE biti za drugu vežbu od one propisane |
| `percentBodyweight` | `percent`     | Zahteva telesnu masu koju standard ne nosi — pogledajte ispod |
| `oneRepMax`         | `kg`, `lb`    | Referentna vrednost, ne zabeležena metrika — pogledajte ispod |
| `tempo`             | `count`       | Konvencija, npr. 3-1-1 kao brojanja. Za stvarno merenje ispod sekunde koristite `duration` sa `ms` |

### Struktura preskripcije

| Tip               | Dozvoljene jedinice | Napomene                                                  |
|-------------------|---------------|-----------------------------------------------------------|
| `sets`            | `count`       | Samo kada su serije same po sebi propisana veličina (rad na gustini: „što više serija za 10 minuta“). Uobičajen broj serija je struktura, a ne metrika |
| `rounds`          | `count`       | Kružni treninzi i AMRAP                                   |
| `rest`            | `s`, `min`    | Propisan odmor, ne opažen                                 |

### Podešavanja mašina

| Tip               | Dozvoljene jedinice | Napomene                                                  |
|-------------------|---------------|-----------------------------------------------------------|
| `cadence`         | `rpm`, `spm`  | `rpm` za bicikl; `spm` za trčanje, veslanje i plivanje    |
| `incline`         | `percent`     | Nagib trake za trčanje                                    |
| `resistanceLevel` | `level`       | Pozicija klina ili položaj u stubu tegova na mašini — neprozirna vrednost, pogledajte ispod |

### Tipovi koji zahtevaju pažnju

**`percentBodyweight`** opisuje opterećenje kao udeo telesne mase sportiste. FDS po dizajnu ne nosi sportistu (ne postoji entitet User niti Profile), pa je ovaj tip razrešiv samo prema telesnoj masi koju obezbedi *konzument*. Proizvođač podataka koji ga emituje MORA prihvatiti da konzumenti bez telesne mase ne mogu prikazati apsolutno opterećenje.

**`oneRepMax`** je referenca *iz* koje se izračunava intenzitet, a ne merenje obavljeno tokom serije. Pripada uz `percent1RM`, a konzument koji ga iscrtava kao metriku po seriji proizvešće besmislicu.

**`resistanceLevel`** je neprozirno podešavanje. „Nivo 7“ dva proizvođača nemaju nikakve veze jedan s drugim, kao ni pozicije klina u dve teretane na nominalno identičnim stubovima tegova. Beležite ga da biste reprodukovali trening na istoj mašini; **ne** pretvarajte ga u opterećenje niti ga poredite između objekata. Tamo gde sprava objavljuje stvarne korake opterećenja, `equipment.loading.increment` je prenosiv odgovor.

## Očekivanja po tipu vežbe

`classification.exerciseType` je otvoreni string (RFC-001 §4.2), pa je ova tabela smernica za uobičajene vrednosti, a ne zatvorena lista.

| Tip vežbe     | Primarna metrika               | Uobičajene sekundarne metrike                                  |
|---------------|--------------------------------|-----------------------------------------------------------------|
| strength      | `reps`                         | `weight`, `tempo`, `rpe`, `rir`, `percent1RM`, `rest`           |
| power         | `reps` ili `duration`          | `weight`, `power`, `height`, `velocity`, `percent1RM`, `rest`   |
| cardio        | `duration` ili `distance`      | `pace` ili `speed`, `heartRate`, `cadence`, `incline`, `resistanceLevel` |
| endurance     | `duration` ili `distance`      | `pace`/`speed`, `heartRate`, `calories`, `cadence`, `rest`      |
| conditioning  | `duration` ili `rounds`        | `rest`, `calories`, `heartRate`, `cadence`, `resistanceLevel`   |
| mobility      | `duration`                     | `tempo`                                                          |
| isometric     | `duration`                     | `rpe`, `rir`                                                     |
| plyometric    | `reps`                         | `height`, `duration`, `rest`                                     |

Napomene:
- Beleženje treninga snage TREBALO BI da podržava barem `reps`; `weight` se snažno preporučuje kada je primenljivo.
- Kardio beleženje TREBALO BI da uključi `duration` i jedno od `distance` ili `pace` (kada je moguće, izvedite jedno iz drugog).
- Mobilnost/izometrija TREBALO BI da koriste `duration` kao primarnu metriku; izbegavajte `reps` osim ako je domenski opravdano.
- Rad zasnovan na brzini uparuje `velocity` sa `percent1RM`, a često i `duration` u `ms` za merenje koncentrične faze. Obe metrike su sekundarne u odnosu na `reps`.
- Propisujte napor pomoću `rpe` **ili** `rir`, dosledno unutar skupa podataka. One su inverzne, a konzument iz golog `count` ne može zaključiti koja je skala korišćena.
- `rest` na vežbi beleži podrazumevanu vrednost koju pokret sugeriše. Preskripcija koja menja odmor između serija nosi ga na nivou serije, ne ovde.

## Opterećivanje, i gde žive koraci opterećenja

`exercise.loading` (RFC-001 §4.6) iskazuje da li pokret prima spoljašnje opterećenje, da li je to opterećenje asistivno i da li se strane opterećuju nezavisno.

**Koraci** opterećenja nisu na vežbi. Najmanji upotrebljiv korak je svojstvo sprave — par tegova od 2,5 kg, skok bučice od 5 lb, jedan klin na stubu tegova — pa živi na `equipment.loading.increment` (RFC-002 §4.4). Isti pokret izveden bučicama i šipkom ima dva različita najmanja koraka, što polje na vežbi ne bi moglo da izrazi.

Konzument koji izračunava apsolutno opterećenje iz `percent1RM` TREBALO BI da zaokruži na najbliži ostvariv umnožak koraka sprave, umesto da prikaže opterećenje koje se ne može složiti na spravu.

## Smernice za validaciju
- Šema vežbe ograničava strukturu `metrics` i pripadnost enumima; ovaj vodič pojašnjava domenska očekivanja i preporučena uparivanja.
- Proizvođači podataka TREBALO BI da biraju metrike u skladu sa `classification.exerciseType`.
- Konzumenti MOGU validirati uparivanja radi boljeg korisničkog iskustva i poruka o greškama.
- Uparivanje kojeg nema u ovom vodiču nije time nevažeće — vodič beleži uparivanja za koja se zna da su smislena, a konzumenti TREBALO BI da upozore umesto da odbace.
