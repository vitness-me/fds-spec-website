---
title: Validación rápida
description: Validar datos FDS contra los esquemas JSON
sidebar_position: 2
---

# Guía de validación rápida

Validar documentos FDS contra los esquemas publicados usando Ajv (Draft 2020-12).

Los comandos siguientes se ejecutan desde una copia clonada del [repositorio de la especificación](https://github.com/vitness-me/fds-spec-website) y no requieren instalar nada más allá de npm: `npx` obtiene el validador (`ajv-cli`) y el plugin de formatos (`ajv-formats`) que los comandos nombran. Cada comando valida el ejemplo distribuido junto al esquema; para validar una exportación propia, reemplazar la ruta de `-d` por el archivo correspondiente.

## Validar los ejemplos

### Esquema de ejercicio

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/exercises/v1.1.0/exercise.schema.json \
  -d specification/schemas/exercises/v1.1.0/exercise.example.json
```

### Esquema de equipamiento

```bash
npx --package=ajv-cli --package=ajv-formats ajv validate --spec=draft2020 -c ajv-formats \
  -s specification/schemas/equipment/v1.1.0/equipment.schema.json \
  -d specification/schemas/equipment/v1.1.0/equipment.example.json
```

## Ubicación de los esquemas

Cada esquema también se sirve en una URL congelada bajo `https://spec.vitness.me/schemas/` — los mismos bytes que las copias del repositorio. El conjunto completo, en las versiones que publica el lanzamiento actual, está en el manifiesto de lanzamientos legible por máquina en [https://spec.vitness.me/releases.json](https://spec.vitness.me/releases.json); la [referencia de esquemas](/docs/schemas) de este sitio documenta cada uno.

Al trabajar sin una copia clonada, descargar un esquema desde su URL y pasar el nombre del archivo descargado a `-s` — `ajv-cli` lee los esquemas desde disco, no obtiene URLs.

## Próximos pasos

- [Explorar los esquemas de forma interactiva](/docs/schemas/exercise)
- [Consultar las especificaciones](/docs/specifications/rfc-001-exercise-data-model)
