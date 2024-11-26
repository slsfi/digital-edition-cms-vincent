# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [Unreleased]

### Changed

- Enable filtering on description field in index of persons.
- Preserve active sorting and filtering when selecting publication in publications list.
- Preserve active sorting and filtering when viewing images in a facsimile collection and returning to facsimile collection list.
- Deps (dev): update `angular-eslint` to 18.4.2.

### Fixed

- Filter name field in publications and publication collections, and external URL field in facsimile collections, on substring matches (opposed to exact matches).
- Remove external URL field from editable fields in edit facsimile dialog.
- Exclude the selected publication’s facsimiles, manuscripts and variants from filtering and sorting applied on the publications list.
- Custom table component: restore original table data on sort reset.



## [1.0.1] – 2024-11-22

### Changed

- Simplify generation of file with app version. ([8d56f10](https://github.com/slsfi/digital-edition-cms-vincent/commit/8d56f10be55e7620c4c8f98972cc3955302347c9))

### Fixed

- Handle Angular routing in nginx to prevent 404 on refresh. ([d631417](https://github.com/slsfi/digital-edition-cms-vincent/commit/d63141783ebe78e16770dd252610aca5b144b49a))



## [1.0.0] – 2024-11-22

Initial release.



[unreleased]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.1...HEAD
[1.0.1]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/slsfi/digital-edition-cms-vincent/releases/tag/1.0.0
