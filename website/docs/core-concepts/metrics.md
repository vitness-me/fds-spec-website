---
title: Metrics
sidebar_position: 1
---
# Metrics Pairing Guide

This guide specifies valid and recommended metric type/unit pairs and per‑exercise‑type expectations to promote consistency across implementations.

## Valid Type/Unit Pairs

| Type        | Allowed Units                                   | Notes                              |
|-------------|--------------------------------------------------|------------------------------------|
| `reps`      | `count`                                          | Whole numbers                      |
| `weight`    | `kg`, `lb`                                       | Prefer one system per dataset      |
| `duration`  | `s`, `min`                                       | Use seconds for precision          |
| `distance`  | `m`, `km`, `mi`                                  |                                    |
| `speed`     | `m_s`, `km_h`                                    |                                    |
| `pace`      | `min_per_km`, `min_per_mi`                       |                                    |
| `power`     | `W`                                              |                                    |
| `heartRate` | `bpm`                                            |                                    |
| `steps`     | `count`                                          |                                    |
| `calories`  | `kcal`                                           | Estimated                          |
| `height`    | `cm`, `in`                                       | For jumps/box height               |
| `tempo`     | `count`                                          | Convention e.g., 3‑1‑1 as counts   |
| `rpe`       | `count`                                          | 1–10 scale                         |

## Exercise Type Expectations

| Exercise Type | Primary Metric                 | Common Secondary Metrics           |
|---------------|-------------------------------|------------------------------------|
| strength      | `reps`                         | `weight`, `tempo`, `rpe`           |
| power         | `reps` or `duration`           | `weight`, `power`, `height`        |
| cardio        | `duration` or `distance`       | `pace` or `speed`, `heartRate`     |
| endurance     | `duration` or `distance`       | `pace`/`speed`, `heartRate`, `kcal`|
| mobility      | `duration`                      | `tempo`                            |
| isometric     | `duration`                      | `rpe`                              |
| plyometric    | `reps`                          | `height`, `duration`               |

Notes:
- Strength logging SHOULD at minimum support `reps`; `weight` is strongly recommended when applicable.
- Cardio logging SHOULD include `duration` and either `distance` or `pace` (derive one from the other when possible).
- Mobility/isometric SHOULD use `duration` as primary; avoid `reps` unless domain‑specific.

## Validation Guidance
- The Exercise schema constrains `metrics` structure; this guide clarifies domain expectations and recommended pairings.
- Producers SHOULD select metrics consistent with `classification.exerciseType`.
- Consumers MAY validate pairings to provide better UX and error messaging.

