---
title: Instalación
description: Ejecutar el FDS Encoder desde una copia local del repositorio de la especificación
sidebar_position: 2
---

# Instalación

El FDS Encoder no está en npm. Se ejecuta desde una copia local del [repositorio de la especificación](https://github.com/vitness-me/fds-spec-website), donde vive en `packages/fds-encoder`.

## Requisitos {#requirements}

- **Node.js:** 20.0.0 o superior
- **npm**
- **git**

Compruebe su versión de Node.js:

```bash
node --version
```

## Construir el paquete {#build-the-package}

Clone el repositorio y construya el paquete. Los comandos de esta página se ejecutan desde la raíz de la copia local.

```bash
git clone https://github.com/vitness-me/fds-spec-website.git
cd fds-spec-website
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

La compilación escribe la biblioteca en `packages/fds-encoder/dist/index.js` y el comando en `packages/fds-encoder/dist/bin/fds-encoder.js`.

## Ejecutar el comando {#run-the-command}

### Sin instalar {#without-installing}

Ejecute el archivo compilado con Node.js:

```bash
node packages/fds-encoder/dist/bin/fds-encoder.js --version
```

```text
0.1.0
```

### Como `fds-encoder` {#as-fds-encoder}

Instale el paquete desde su carpeta para poner `fds-encoder` en su ruta:

```bash
npm install -g ./packages/fds-encoder
fds-encoder --version
```

```text
0.1.0
```

npm enlaza el comando global a la carpeta, así que una compilación posterior lo actualiza. Las demás páginas de esta sección escriben `fds-encoder`. Si no lo instaló, escriba `node packages/fds-encoder/dist/bin/fds-encoder.js` en su lugar.

Para quitar el comando:

```bash
npm uninstall -g @vitness/fds-encoder
```

## Usar la biblioteca en un proyecto {#use-the-library-in-a-project}

Instale el paquete desde la copia local en su proyecto, por su ruta:

```bash
npm install /path/to/fds-spec-website/packages/fds-encoder
```

Luego impórtelo:

```typescript
import { checkKey } from '@vitness/fds-encoder';

console.log(checkKey('FXM=1.0/biceps-brachii.long').ok); // true
```

El paquete es un módulo ES e incluye sus tipos de TypeScript. npm enlaza su proyecto a la carpeta, así que construya el paquete antes de importarlo. Una compilación posterior actualiza también su proyecto.

## Ejecutar las comprobaciones propias del paquete {#run-the-packages-own-checks}

```bash
npm --prefix packages/fds-encoder run typecheck
npm --prefix packages/fds-encoder run test:run
```

## Solución de problemas {#troubleshooting}

**`fds-encoder: command not found`.** El comando no está en su ruta. Ejecute `npm install -g ./packages/fds-encoder` desde la raíz de la copia local, y compruebe que la carpeta global de npm está en su ruta: `npm prefix -g` la imprime, y el comando vive en su carpeta `bin`. O ejecute directamente el archivo compilado: `node packages/fds-encoder/dist/bin/fds-encoder.js`.

**El script de conformidad dice `dist/index.js does not exist`.** `node scripts/check-conformance.mjs` y `npm run check:keys` leen el paquete compilado, `packages/fds-encoder/dist`, y se detienen con el código de salida 2 cuando no está:

```text
…/packages/fds-encoder/dist/index.js does not exist. Build the encoder first:
  npm --prefix packages/fds-encoder ci && npm --prefix packages/fds-encoder run build
```

Constrúyalo primero:

```bash
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

Vuelva a construirlo después de cambiar el paquete o de traer commits nuevos: un `dist` de una compilación anterior comprueba el código anterior.

## Próximos pasos {#next-steps}

- [Referencia de la CLI](./cli-reference.md): todos los comandos y opciones.
- [API de la biblioteca](./library-api.md): las funciones exportadas.
- [Ejemplos](./examples.md): recorridos de extremo a extremo.
