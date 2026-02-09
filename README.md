# WhatIEarn

**WhatIEarn** is a salary calculator and time-tracking web app. Track normal, Sunday, and holiday hours, add custom deductions, and view monthly earnings—all with data stored locally in your browser.

## Features

- **Salary calculator** — Enter normal, Sunday, and holiday hours; add custom deductions and see net pay.
- **Time tracker** — Clock in/out with optional break times; supports normal, Sunday, and holiday work types.
- **Calendar** — View and manage work entries by date.
- **Work records** — List and filter past records; export to PDF.
- **Monthly report** — See earnings over time with charts.
- **Settings** — Configure hourly rates (normal, Sunday, holiday), custom holidays, and optional employee/company details.
- **Offline & PWA** — Works offline; installable as an app; data stored in IndexedDB.

## Tech stack

- **Next.js 14** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **IndexedDB** (via `idb`) for local storage
- **Recharts** for reports
- **jsPDF** for PDF export
- **Lucide React** for icons

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

### Install and run

```bash
# Install dependencies
pnpm install

# Run in development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

## Project structure

- `app/` — Next.js App Router (layout, page, globals)
- `components/` — UI and feature components (calculator, tracker, calendar, etc.)
- `lib/` — Database (IndexedDB), PDF generator, work utilities
- `public/` — Static assets, manifest, service worker

## License

Private/project-specific. See repository for details.

## Contributing

Open an issue or pull request on GitHub. See the footer in the app for the repository and developer links.
