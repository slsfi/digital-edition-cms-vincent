# Vincent – CMS for the SLS Digital Edition Platform

»Vincent» is the frontend of the content management system for the SLS Digital Edition Platform, named after the
bold and efficacious protagonist in one of [Zacharias Topelius short stories](https://topelius.sls.fi/sv/collection/211/text/20211). It allows editors to manage information about publications and facsimiles in the digital edition database, and to upload facsimile images to the backend. It relies on the [SLS Digital Edition API][digital_edition_api].

The app is built on [Angular][angular] and uses [Angular Material][material] web components. It was originally generated with [Angular CLI][angular_cli] version 18.2.6.

<p>
  <a href="https://github.com/angular/angular"><img alt="Angular Core version badge" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fslsfi%2Fdigital-edition-cms-vincent%2Fmain%2Fpackage-lock.json&query=%24%5B'packages'%5D%5B'node_modules%2F%40angular%2Fcore'%5D%5B'version'%5D&prefix=v&logo=angular&logoColor=%23fff&label=Angular%20Core&color=%23dd0031"></a>
</p>

»Vincent» was developed by [Identio][identio] (commissioned by SLS in October 2024).

<hr>

## Changelog

[Learn about the latest improvements][changelog].



## Development Setup

### Prerequisites

1. Install [Node.js][node.js] which includes [npm][npm]. The app is compatible with Node `^20.19.0`, `^22.12.0` and `^24.0.0` (based on [Angular 20 compatibility][angular_version_compatibility]). Check your Node version with:

```
Node --version
```

2. Install the [Angular CLI][angular_cli] globally:

```
npm install -g @angular/cli
```

3. [Clone][clone_repository] the repository locally and `cd` into the folder. On Windows you can use [GitHub Desktop][github_desktop] or [Git Bash][git_bash] (see [tutorial on Git Bash][git_bash_tutorial]).

4. Install dependencies:

```
npm install
```

### Run local development server

To build and serve the application on a development server, run:

```
npm start
```

Open your browser on http://localhost:4200/. The app will automatically rebuild and reload if you change any of the source files.



## Building and deployment

On each commit in the `main` branch a Docker image with the tag `main` is automatically built using GitHub Actions and stored in the [GitHub Container Registry][vincent_ghcr].

On each release a Docker image with the chosen release tag and the tag `latest` is automatically built using GitHub Actions and also stored in the [GitHub Container Registry][vincent_ghcr].

To deploy the latest image, you can clone the repository or just [`compose.yaml`][compose.yaml] and run:

```
docker compose up -d
```



## Keeping the app up-to-date

### Dependencies

Most of the dependencies are part of the [Angular framework][angular] (`@angular/`). These should be updated with the command:

```
ng update @angular/cli @angular/core @angular/cdk @angular/material
```

If there is a new major version of Angular and you don’t want to update to it, you need to pin the current major version number in the `ng update` command:

```
ng update @angular/cli@^<current_major> @angular/core@^<current_major> @angular/cdk@^<current_major> @angular/material@^<current_major>
```

When updating to a new major version of Angular, check the update guide first: <https://angular.dev/update-guide>. Also update the Angular major version number specified in [`Dockerfile`][dockerfile].

Other dependencies can be updated by bumping the version number in [`package.json`][package.json] and running:

```
npm install
```

### Node.js and nginx Docker images

[Node.js][node.js] and [nginx][nginx] Docker images are used in the build process. To update these, change the tags specified in both [`Dockerfile`][dockerfile] and in [`docker-build-and-push.yml`][docker_build]. The versions specified in [`docker-build-and-push.yml`][docker_build] are the ones that will actually be used in the build process (the versions in [`Dockerfile`][dockerfile] are defaults).



## Further development notes

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

### Lint

Run `ng lint`

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

### Directory structure

#### Components

Contains components used in pages

#### guards

Route guards

#### Interceptors

Http interceptors

#### Models

Typescript interfaces, enums and commonly used data

#### Pages

Components which are used as base route components in app.routes.ts

#### Pipes

Custom pipes

#### Services

- Api - handle http requests
- Auth - handle user authentication
- QueryParams - Get and set query params
- Loading - stores loading state, connected with loading interceptor
- GET and EDIT data
  - Facsimile, Project, Publication, Subject, Translations



[angular]: https://angular.dev/
[angular_cli]: https://angular.dev/cli
[angular_version_compatibility]: https://angular.dev/reference/versions
[changelog]: CHANGELOG.md
[clone_repository]: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[compose.yaml]: compose.yaml
[digital_edition_api]: https://github.com/slsfi/digital_edition_api
[docker_build]: .github/workflows/docker-build-and-push.yml
[dockerfile]: Dockerfile
[git_bash]: https://gitforwindows.org/
[git_bash_tutorial]: https://www.atlassian.com/git/tutorials/git-bash
[github_desktop]: https://desktop.github.com/
[identio]: https://identio.fi/en/
[material]: https://material.angular.io/
[nginx]: https://nginx.org/
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/get-npm
[package.json]: package.json
[SLS]: https://www.sls.fi/en
[vincent_ghcr]: https://github.com/slsfi/digital-edition-cms-vincent/pkgs/container/digital-edition-cms-vincent
