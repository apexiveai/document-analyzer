# Document Analyzer

Thanks for taking the time to improve Document Analyzer.

## Project Overview

This is a Next.js application that uses Supabase for authentication and data storage, plus AI providers for document analysis and audit workflows. Most of the app lives in:

- `app/` for routes, pages, and API handlers
- `components/` for reusable UI
- `lib/` and `services/` for data access, AI, billing, and shared helpers
- `supabase/migrations/` for database schema changes

## Getting Started

1. Install dependencies with `npm install`.
2. Create the required environment variables locally.
3. Start the app with `npm run dev`.

## Required Environment Variables

The codebase expects these variables in the relevant environments:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `AI_PROVIDER` when you want to choose a provider explicitly
- `OPENAI_MODEL`, `ANTHROPIC_MODEL`, or Azure OpenAI variables when applicable
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_VARIANT_ID`
- `LEMON_SQUEEZY_WEBHOOK_SECRET`

If you are only working on a subset of the app, you may not need every variable at runtime, but the production flows depend on them.

## Development Workflow

- Create a feature branch before making changes. Keep the branch focused on one issue or feature.
- Use short, descriptive branch names such as `feature/upload-guard`, `fix/auth-recovery`, or `docs/contributing`.
- Keep changes focused and prefer small, reviewable commits.
- Follow the existing patterns in the area you are touching instead of introducing new abstractions.
- Update database migrations when the Supabase schema changes.
- Avoid mixing unrelated UI, API, and schema work in the same pull request when possible.

## Validation

Before opening a pull request, run the checks that apply to your change:

```bash
npm run lint
npm run build
```

If you changed Supabase schema or server-side data flows, also verify the affected routes or flows manually in the app.

## Database Changes

If your change requires schema updates, add a new migration under `supabase/migrations/` rather than editing older migrations. Keep migrations incremental and easy to review.

## Pull Request Expectations

Before requesting review, make sure:

- The branch is rebased or otherwise up to date with `main` if needed.
- `npm run lint` and `npm run build` pass for the touched area.
- Any required migrations are included and applied in the right order.
- The PR description explains any tradeoffs, known limitations, or follow-up work.

## Style Notes

- Match the existing file and folder organization.
- Reuse current utilities in `lib/` and `services/` when possible.
- Keep UI changes consistent with the app's current design language.
- Prefer clear, explicit code over clever shortcuts.

If you are unsure about a change, open a draft PR or describe the tradeoff in the PR notes so it can be reviewed early.
