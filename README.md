# Czarles Construction and Supplies

Company website and internal HR and payroll system for Czarles Construction and Supplies.

Built with Vue 3, TypeScript, Pinia, Vuetify and Supabase.

## Features

**Public website**

- Home, About, Company and Contact pages
- Privacy Policy, Terms and Conditions, and Change Logs

**Internal system** (login required)

- Dashboard and account settings
- Users: user accounts and roles
- Employees: employee records, rates and benefits, memos
- Attendance: attendance records, leave and overtime, with their requests
- Payroll: payroll, supplemental pay, cash advances and cash advance requests

## Tech Stack

| Area       | Tools                                     |
| ---------- | ----------------------------------------- |
| Framework  | Vue 3, TypeScript, Vite                   |
| UI         | Vuetify, Material Design Icons, Leaflet   |
| State      | Pinia                                     |
| Routing    | Vue Router                                |
| Forms      | VeeValidate, Zod, Yup                     |
| Backend    | Supabase (database, auth, Edge Functions) |
| PDF export | html2pdf.js                               |
| Tooling    | ESLint, Prettier, Husky                   |
| Hosting    | Vercel                                    |

## Getting Started

### Prerequisites

- Node.js 22
- npm
- pnpm (the Husky Git hooks call it)
- A Supabase project

### Setup

1. Install the dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the project root:

   ```sh
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_SUPABASE_SERVICE_ROLE=
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

Email features call the Supabase Edge Functions `send-notification` and `send-client-email`. These functions are not in this repository, so they must be deployed to your Supabase project.

## Scripts

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start the Vite development server          |
| `npm run build`      | Type-check and build for production        |
| `npm run build-only` | Build for production without type-checking |
| `npm run preview`    | Preview the production build locally       |
| `npm run type-check` | Run `vue-tsc`                              |
| `npm run lint`       | Run ESLint and apply fixes                 |
| `npm run format`     | Format `src/` with Prettier                |

## Git Hooks

Husky runs these hooks:

- `pre-commit`: lint, type-check and format
- `post-commit`: build without type-checking

## Project Structure

```text
src/
├── assets/       # Styles, images and logos
├── components/   # Shared, landing and layout components
├── router/       # Routes and navigation guards
├── stores/       # Pinia stores
├── utils/        # Supabase client, validators, helpers, Vuetify config
└── views/
    ├── auth/     # Login
    ├── errors/   # Forbidden and Not Found pages
    ├── landing/  # Public website
    └── system/   # Dashboard, settings and admin modules
```

## Deployment

The app deploys to Vercel. `vercel.json` rewrites all paths to `/` so that Vue Router handles them. Set the environment variables above in the Vercel project.
