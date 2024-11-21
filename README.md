# WhatIEarn ⏰💰

![WhatIEarn Logo](public/logo.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Contributors](https://img.shields.io/github/contributors/aj4200/whatiearn)](https://github.com/aj4200/whatiearn/graphs/contributors)

A modern, open-source employee timesheet and payroll calculator built with Next.js

[Demo](https://whatiearn.vercel.app) • [Report Bug](https://github.com/aj4200/whatiearn/issues) • [Request Feature](https://github.com/aj4200/whatiearn/issues)

## ✨ Features

- 📱 Progressive Web App (PWA) - Install on any device
- ⏱️ Easy time tracking with start/stop functionality
- 💰 Automatic pay calculation based on hours worked
- 🗓️ Special rates for Sundays and holidays
- 📊 Visual reports and statistics
- 🔄 Offline support with local SQLite storage
- 📱 Responsive design for all devices
- 🔐 Simple user management system

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Installation

1. Clone the repository

```bash
git clone https://github.com/aj4200/whatiearn.git
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Run the development server

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

## 🛠️ Tech Stack

- [Next.js 15](https://nextjs.org/) - React Framework
- [SQLite](https://www.sqlite.org/) - Database
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Language
- PWA Capabilities

## 📖 How It Works

WhatIEarn helps track employee working hours and calculate pay with special considerations:

- Regular hours: Base pay rate
- Sunday rates: 1.5x multiplier
- Holiday rates: 2x multiplier
- Overtime calculations
- Break time tracking
- Monthly/weekly summaries

## 💻 Key Features

### Time Tracking

- Clock in/out functionality
- Break time management
- Automatic overtime detection
- GPS location tracking (optional)

### Pay Calculation

- Configurable base pay rates
- Special day rate multipliers
- Overtime calculations
- Tax considerations

### Reporting

- Daily summaries
- Weekly/Monthly reports
- Export functionality
- Visual analytics

### Data Management

- Local SQLite storage
- Offline capability
- Data backup/restore
- Multi-user support

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🔧 Configuration

The application can be configured through environment variables:

```env
DATABASE_URL=sqlite://./database.sqlite
DEFAULT_RATE=25
SUNDAY_MULTIPLIER=1.5
HOLIDAY_MULTIPLIER=2.0
```

## 📦 Project Structure

```
whatiearn/
├── app/
├── components/
├── lib/
├── utils/
└── types/
├── public/
├── prisma/
└── package.json
```

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/aj4200/whatiearn](https://github.com/aj4200/whatiearn)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Vercel](https://vercel.com/)
- [SQLite](https://www.sqlite.org/)
- All our contributors

---

Made with ❤️ by the open source community
