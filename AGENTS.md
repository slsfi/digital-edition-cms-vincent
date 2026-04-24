# Repository Guidelines

## Project Structure & Module Organization

This is an Angular CMS application for the SLS Digital Edition Platform. Application code lives under `src/app`, with feature pages in `src/app/pages`, reusable UI in `src/app/components`, services in `src/app/services`, route guards in `src/app/guards`, interceptors in `src/app/interceptors`, models in `src/app/models`, pipes in `src/app/pipes`, and shared test helpers in `src/testing`. Global styles are in `src/styles.scss`, static assets are in `public`, and generated build output goes to `dist`. Deployment-related files are at the root, including `Dockerfile`, `compose.yaml`, `nginx.conf`, and `.github/workflows`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm start`: run `ng serve` for local development at `http://localhost:4200/`.
- `npm run build`: generate `src/config/app-version.ts` via `prebuild`, then build the Angular app into `dist/`.
- `npm run watch`: build continuously with the development configuration.
- `npm test`: run Angular unit tests with Karma and Jasmine.
- `npm run lint`: run Angular ESLint checks for TypeScript and templates.
- `docker compose up -d`: run the published container setup using `compose.yaml`.

## Coding Style & Naming Conventions

Use TypeScript, Angular standalone patterns, and Angular CLI conventions already present in the repo. Keep indentation at 2 spaces, prefer single quotes in TypeScript, trim trailing whitespace, and end files with a newline as defined in `.editorconfig`. Component selectors are kebab-case with no prefix, while directive selectors use camelCase with the `app` prefix. Name Angular files by role, for example `publication.service.ts`, `custom-table.component.ts`, and `id-route.pipe.ts`.

## Testing Guidelines

Place unit tests beside the implementation as `*.spec.ts`. Use Jasmine/Karma through Angular TestBed, and reuse helpers from `src/testing/test-providers.ts` where appropriate. Add or update specs when changing services, guards, interceptors, pipes, or component behavior. For focused local runs, use Angular/Karma include flags, for example `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/services/auth.service.spec.ts`.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commits, such as `fix(auth): harden login, refresh, and redirect flow` and `build(dev-deps): bump eslint`. Use short imperative subjects with a type and optional scope: `fix`, `feat`, `build`, `test`, `docs`, or `refactor`. Pull requests should describe the user-facing change, list verification commands run, link related issues, and include screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit secrets or local environment files. The app depends on the SLS Digital Edition API, so keep API URLs and proxy behavior aligned with `proxy.conf.json`, deployment settings, and README guidance.
