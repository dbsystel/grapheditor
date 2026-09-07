# Themes

This directory contains the theme configuration for the application.
The active theme is selected at **build time** via the `VITE_THEME` environment variable (see `frontend/.env.dist`).

## How it works

A Vite alias (`@theme`) points to the folder of the active theme:

- `VITE_THEME=whitelabel` (default) → `src/assets/themes/whitelabel/`
- `VITE_THEME=db` → `src/assets/themes/db/`

Each theme folder must contain a `theme.scss` file, which is imported in `src/main.tsx`.
For theme-specific components, export them from the theme folder and import via `@theme/ComponentName`.

## Adding a new theme

1. Create a new folder: `src/assets/themes/<theme-name>/`
2. Add a `theme.scss` file (define or import brand colors/styles)
3. Add theme-specific component variants if needed (e.g. `Logo.tsx`)
4. Select the theme via `VITE_THEME=<theme-name>` — either in `.env` (local) or as an environment variable in CI/CD. No extra npm script needed.

## Theme-specific components

If a component needs to look or behave differently per theme, create a theme-specific version in each theme folder.

**Example: Logo**

- `src/assets/themes/whitelabel/Logo.tsx` — Whitelabel version
- `src/assets/themes/db/Logo.tsx` — DB version

Then import it generically in your component:

```typescript
import { Logo } from '@theme/Logo';
```

Vite resolves `@theme` to the active theme folder at build time.
Every theme folder that introduces a theme-specific component must provide that file.
Otherwise the build will fail for that theme.

## Theme overview

| Folder       | Description                      | Special setup required    |
| ------------ | -------------------------------- | ------------------------- |
| `whitelabel` | Default, neutral branding        | No                        |
| `db`         | Deutsche Bahn corporate branding | Yes — see frontend README |
