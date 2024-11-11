# Vincent – CMS for the SLS Digital Edition Platform

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Lint

Run `ng lint`

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Directory structure

### Components
Contains components used in pages

### guards
Route guards

### Interceptors
Http interceptors

### Models
Typescript interfaces, enums and commonly used data

### Pages
Components which are used as base route components in app.routes.ts

### Pipes
custom pipes

### Services
- Api - handle http requests
- Auth - handle user authentication
- QueryParams - Get and set query params
- Loading - stores loading state, connected with loading interceptor
- GET and EDIT data
  - Facsimile, Project, Publication, Subject, Translations
