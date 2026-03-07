# Blok – Sitecore Design System

The marketplace app uses [Blok](https://blok.sitecore.com/), Sitecore's design system built on shadcn/ui.

## Adding components

Install Blok components with the full URL:

```bash
# Blok theme (design tokens) – add first
npx shadcn@latest add https://blok.sitecore.com/r/theme.json

# Individual components
npx shadcn@latest add https://blok.sitecore.com/r/button.json
npx shadcn@latest add https://blok.sitecore.com/r/dialog.json
npx shadcn@latest add https://blok.sitecore.com/r/input.json
# etc.
```

## All Blok components

```bash
npx shadcn@latest add https://blok.sitecore.com/r/blok-components.json
```

## Guidelines

- **Use only Blok/shadcn components** for UI – no raw Radix or custom primitives.
- Add new components from the Blok registry when needed.
- Follow Blok’s usage patterns (variants, color schemes, etc.).
