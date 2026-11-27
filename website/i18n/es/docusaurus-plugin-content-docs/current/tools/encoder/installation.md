---
title: Instalación
description: Instalar el FDS Encoder desde npm
sidebar_position: 2
---

# Instalación

El FDS Encoder es el paquete de npm `@vitness/fds-encoder`. Le da el comando `fds-encoder` y una biblioteca.

## Requisitos {#requirements}

- **Node.js:** 20.0.0 o superior
- **npm**, **pnpm** o **yarn**

Compruebe su versión de Node.js:

```bash
node --version
```

## Instalar el comando {#install-the-command}

Instale el paquete de forma global para poner `fds-encoder` en su ruta:

<PackageManagerTabs packages="@vitness/fds-encoder" global />

Compruebe que se ejecuta:

```bash
fds-encoder --version
```

```text
0.1.0
```

Las demás páginas de esta sección escriben `fds-encoder`.

### Ejecutarlo sin instalar {#run-it-without-installing}

<PackageManagerTabs
  command={{
    pnpm: "pnpm dlx @vitness/fds-encoder --version",
    npm: "npx @vitness/fds-encoder --version",
    yarn: "yarn dlx @vitness/fds-encoder --version",
  }}
/>

### Quitarlo {#remove-it}

```bash
npm uninstall -g @vitness/fds-encoder
```

## Usar la biblioteca en un proyecto {#use-the-library-in-a-project}

Agregue el paquete a su proyecto:

<PackageManagerTabs packages="@vitness/fds-encoder" />

Luego impórtelo:

```typescript
import { checkKey } from '@vitness/fds-encoder';

console.log(checkKey('FXM=1.0/biceps-brachii.long').ok); // true
```

El paquete es un módulo ES e incluye sus tipos de TypeScript.

## Trabajar en el propio Encoder {#work-on-the-encoder-itself}

El paquete vive en `packages/fds-encoder` del [repositorio de la especificación](https://github.com/vitness-me/fds-spec-website). Constrúyalo desde una copia local para modificarlo, o para ejecutar los casos de conformidad contra su compilación. Los comandos siguientes se ejecutan desde la raíz de la copia local.

```bash
git clone https://github.com/vitness-me/fds-spec-website.git
cd fds-spec-website
npm --prefix packages/fds-encoder ci
npm --prefix packages/fds-encoder run build
```

La compilación escribe la biblioteca en `packages/fds-encoder/dist/index.js` y el comando en `packages/fds-encoder/dist/bin/fds-encoder.js`. Ejecute el comando compilado con `node packages/fds-encoder/dist/bin/fds-encoder.js`.

Ejecute las comprobaciones propias del paquete:

```bash
npm --prefix packages/fds-encoder run typecheck
npm --prefix packages/fds-encoder run test:run
```

## Solución de problemas {#troubleshooting}

**`fds-encoder: command not found`.** El comando no está en su ruta. Instálelo de forma global y compruebe que la carpeta global de npm está en su ruta: `npm prefix -g` la imprime, y el comando vive en su carpeta `bin`. O ejecútelo sin instalar, con `npx @vitness/fds-encoder`.

**El script de conformidad dice `dist/index.js does not exist`.** `node scripts/check-conformance.mjs` y `npm run check:keys` leen el paquete compilado en una copia local, `packages/fds-encoder/dist`, y se detienen con el código de salida 2 cuando no está:

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
