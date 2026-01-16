# Fitness Data Standard (FDS) - Public Documentation Website

Public documentation website for the [Fitness Data Standard (FDS)](https://spec.vitness.me/) specification.

**Live Site:** https://spec.vitness.me/

## About

This repository hosts the official FDS specification documentation website, built with [Docusaurus](https://docusaurus.io/). The website provides:

- **Interactive Documentation** - Browse RFCs, JSON schemas, and implementation guides
- **Schema Viewers** - Explore data models with examples and validation rules
- **Governance** - Understand the RFC process, contribution guidelines, and versioning
- **Quick Start Guides** - Get started with FDS integration

## Repository Structure

```
fds-spec-website/
├── specification/          # FDS specification content (RFCs, schemas, governance)
│   ├── rfc/               # RFC documents (001-005)
│   ├── schemas/           # JSON Schema definitions (v1.0.0)
│   ├── registries/        # Reference data (exercises, equipment, muscles)
│   └── governance/        # Governance, contributing, changelog
│
├── website/               # Docusaurus website
│   ├── docs/             # Documentation pages
│   ├── src/              # React components and pages
│   ├── static/           # Static assets (schemas, registries via symlinks)
│   └── docusaurus.config.ts  # Site configuration
│
└── .github/workflows/    # GitHub Actions for deployment
```

## What is FDS?

The **Fitness Data Standard (FDS)** is an open, interoperable standard for fitness domain data. It enables:

- **Data Portability** - Move your fitness data between applications seamlessly
- **Interoperability** - Different fitness platforms can exchange structured data
- **Extensibility** - Platform-specific extensions without breaking compatibility
- **Versioning** - Clear semantic versioning for long-term ecosystem health

### Current Scope

- **Exercise Data Model** (RFC-001) - Comprehensive exercise definitions
- **Equipment Data Model** (RFC-002) - Fitness equipment taxonomy
- **Muscle Data Model** (RFC-003) - Anatomical muscle definitions
- **Muscle Category Data Model** (RFC-004) - Muscle grouping structures
- **Body Atlas Data Model** (RFC-005) - Body visualization and heatmaps

For detailed information about the FDS specification itself, see [`specification/README.md`](./specification/README.md).

## Development

### Prerequisites

- Node.js 18+
- npm

### Local Development

```bash
# Navigate to website directory
cd website

# Install dependencies
npm install

# Start development server
npm start
```

The site will open at `http://localhost:3000/`

### Build

```bash
cd website
npm run build
```

Static files are generated in `website/build/`

### Preview Production Build

```bash
cd website
npm run serve
```

### Project Structure

- **`website/docs/`** - All documentation pages (markdown/MDX)
  - `getting-started/` - Quickstart guides, validation, identifiers
  - `core-concepts/` - Discovery, extensions, i18n, metrics
  - `specifications/` - RFC documents (001-005)
  - `schemas/` - Schema detail pages
  - `examples/` - Example data and implementation patterns
  - `governance/` - Governance, contributing, changelog

- **`website/docusaurus.config.ts`** - Site configuration (navbar, footer, theme)
- **`website/sidebars.ts`** - Documentation navigation structure
- **`website/static/schemas/`** - Symlink to `../../specification/schemas/`
- **`website/static/registries/`** - Symlink to `../../specification/registries/`

## Deployment

The site automatically deploys to GitHub Pages via GitHub Actions on every push to `main`.

**GitHub Actions Workflow:** `.github/workflows/deploy.yml`

The workflow:
1. Checks out the repository
2. Installs Node.js dependencies
3. Builds the Docusaurus site
4. Deploys to GitHub Pages

## Contributing

We welcome contributions to improve the FDS documentation! Please see:

- [Contributing Guide](./specification/governance/CONTRIBUTING.md) - How to propose changes
- [Governance](./specification/governance/GOVERNANCE.md) - RFC process and decision-making

To contribute to the website:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Make your changes in `website/docs/` or `website/src/`
4. Test locally (`npm start` in `website/`)
5. Commit your changes
6. Push and open a Pull Request

## License

The FDS specification, schemas, and documentation are provided under the **VITNESS Open Standards License Agreement**.

See [specification/VITNESS Open Standards License Agreement.md](./specification/VITNESS%20Open%20Standards%20License%20Agreement.md)

## Links

- **Live Website:** https://spec.vitness.me/
- **Specifications:** https://spec.vitness.me/docs/specifications/rfc-001-exercise-data-model
- **Schemas:** https://spec.vitness.me/docs/schemas
- **Issues:** https://github.com/vitness-me/fds-spec-website/issues

---

**Maintained by:** [VITNESS](https://github.com/vitness-me)
