---
title: Instalación
description: Instalar y configurar la CLI del FDS Transformer
sidebar_position: 2
---

# Instalación

Esta guía cubre la instalación del FDS Transformer y la preparación del entorno.

## Requisitos

- **Node.js:** 20.0.0 o superior
- **npm/pnpm/yarn:** Cualquier gestor de paquetes moderno

Verificar la versión de Node.js:

```bash
node --version
# Should output v20.0.0 or higher
```

## Métodos de instalación

### Instalación global (recomendada para la CLI)

Instalar globalmente para usar `fds-transformer` desde cualquier ubicación:

<PackageManagerTabs packages="@vitness/fds-transformer" global />

Verificar la instalación:

```bash
fds-transformer --version
# 0.1.0
```

### Instalación local en el proyecto

Instalar como dependencia del proyecto:

<PackageManagerTabs packages="@vitness/fds-transformer" />

Ejecutar mediante los scripts del gestor de paquetes:

<PackageManagerTabs
  command={{
    pnpm: "pnpm exec fds-transformer --version",
    npm: "npx fds-transformer --version",
    yarn: "yarn fds-transformer --version",
  }}
/>

O agregar a `package.json`:

```json fds:ignore an npm package.json excerpt
{
  "scripts": {
    "transform": "fds-transformer transform --config ./mapping.json",
    "validate": "fds-transformer validate"
  }
}
```

### Ejecución sin instalar

Ejecutar directamente sin instalar:

<PackageManagerTabs
  command={{
    pnpm: "pnpm dlx @vitness/fds-transformer --version",
    npm: "npx @vitness/fds-transformer --version",
    yarn: "yarn dlx @vitness/fds-transformer --version",
  }}
/>

## Configuración del entorno

### Clave de API para el enriquecimiento con IA

Para usar las funciones de enriquecimiento con IA se necesita una clave de API de OpenRouter:

1. Obtener una clave de API en [OpenRouter](https://openrouter.ai/)
2. Definir la variable de entorno:

```bash
# Unix/macOS
export OPENROUTER_API_KEY=your-api-key-here

# Windows (PowerShell)
$env:OPENROUTER_API_KEY = "your-api-key-here"

# Windows (CMD)
set OPENROUTER_API_KEY=your-api-key-here
```

Para una configuración persistente, agregarla al perfil del shell (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export OPENROUTER_API_KEY=your-api-key-here
```

### Uso de un archivo .env

También se puede usar un archivo `.env` en el proyecto:

```bash
# .env
OPENROUTER_API_KEY=your-api-key-here
FDS_TRANSFORMER_MODEL=anthropic/claude-sonnet-4.5
DEBUG_ENRICHMENT=false
```

Cargarlo con una herramienta como `dotenv-cli`:

```bash
npx dotenv-cli -- fds-transformer transform --config ./mapping.json
```

## Variables de entorno

| Variable | Descripción | Valor predeterminado |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Clave de API para OpenRouter (requerida para el enriquecimiento con IA) | - |
| `FDS_TRANSFORMER_MODEL` | Anula el modelo de IA predeterminado | Valores predeterminados por nivel |
| `DEBUG_ENRICHMENT` | Habilita el registro detallado del enriquecimiento | `false` |

## Verificación de la instalación

Probar que todo funciona:

```bash
# Check version
fds-transformer --version

# Run interactive mode
fds-transformer

# List available schemas
fds-transformer schemas list
```

Salida esperada de `schemas list`:

```
┌  FDS Schemas
│
◇  Available schema versions:
│    1.0.0 (bundled)
│
└  Done
```

## Solución de problemas

### Comando no encontrado

Si `fds-transformer` no se encuentra después de la instalación global:

1. Asegurarse de que el directorio `bin` global de npm esté en el PATH:
   ```bash
   npm config get prefix
   # Add {prefix}/bin to your PATH
   ```

2. O usar npx:
   ```bash
   npx fds-transformer --version
   ```

### Errores de permisos (Unix/macOS)

Si aparecen errores de permisos durante la instalación global:

```bash
# Option 1: Use a Node version manager (recommended)
# Install nvm: https://github.com/nvm-sh/nvm

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Versión de Node demasiado antigua

Si aparecen errores de compatibilidad, actualizar Node.js:

```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

## Próximos pasos

- [Referencia de la CLI](/docs/tools/transformer/cli-reference) - Todos los comandos disponibles
- [Configuración](/docs/tools/transformer/configuration) - Preparación de la configuración de mapeo
- [Ejemplos](/docs/tools/transformer/examples) - Flujos de trabajo completos
