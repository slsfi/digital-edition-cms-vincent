# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [Unreleased]

### Added

- `testa-jansson-api.sls.fi` to environments.

### Changed

- Deps: update `@angular/core` to 19.2.10, `@angular/cli` to 19.2.11, `@angular/cdk` and `@angular/material` to 19.2.15.
- Deps (dev): update `@types/jasmine` to 5.1.8.
- Deps (dev): update `angular-eslint` to 19.4.0.
- Deps (dev): update `eslint` to 9.26.0.
- Deps (dev): update `jasmine-core` to 5.7.1.
- Deps (dev): update `typescript-eslint` to 8.32.0.



## [1.2.2] – 2025-04-30

### Changed

- Deps: update `@angular/core` to 19.2.8, `@angular/cli` to 19.2.9, `@angular/cdk` and `@angular/material` to 19.2.11. ([dd95e60](https://github.com/slsfi/digital-edition-cms-vincent/commit/dd95e6006154dbf8a6231c608c97d66d494d98cc))
- Deps (dev): update `eslint` to 9.25.1. ([2eed294](https://github.com/slsfi/digital-edition-cms-vincent/commit/2eed294de8ed0d2bf5dc30d98932d64609de8d05))
- Deps (dev): update `typescript-eslint` to 8.31.0. ([06ff999](https://github.com/slsfi/digital-edition-cms-vincent/commit/06ff999ea084c8fc2fecce83a097a84d5dcfd0b6))
- Deps (dev): update `jasmine-core` to 5.7.0. ([7a40faa](https://github.com/slsfi/digital-edition-cms-vincent/commit/7a40faa224f0866639f9a5f400fb58c8be9f9f61))
- Deps (dev): update `typescript` to 5.8.3. ([597e590](https://github.com/slsfi/digital-edition-cms-vincent/commit/597e590fcdeebf6e0758389f06f14df0b0efa2af))

### Fixed

- Insert publications in the database in order when adding multiple publications to a collection. ([fe603dc](https://github.com/slsfi/digital-edition-cms-vincent/commit/fe603dcecaec48dc56e48c233f4752615a93274c))
- Remove formatting of original publication date in selected publication info. ([eb7f183](https://github.com/slsfi/digital-edition-cms-vincent/commit/eb7f1838fbaa8a8ec690f156b77adfd1e46d8f46))



## [1.2.1] – 2025-04-01

### Added

- ID of selected publication collection after collection name. ([3f3af11](https://github.com/slsfi/digital-edition-cms-vincent/commit/3f3af11e4e29c26325b891ca83e702fccec532d0))

### Fixed

- Clear the cached file tree when the project changes and the project git repository on the server is synced. ([995dfc5](https://github.com/slsfi/digital-edition-cms-vincent/commit/995dfc52b1e46664aa4f45ac1cb979838594845b))
- Prevent repeated POST requests tied to selected project, causing duplicate database writes for the same user action. ([370008c](https://github.com/slsfi/digital-edition-cms-vincent/commit/370008ce1167f5a2414a1ba38ccf61e65645a85e))



## [1.2.0] – 2025-03-27

### Added

- Facsimile image upload: replace all images in collection. ([c6067c0](https://github.com/slsfi/digital-edition-cms-vincent/commit/c6067c00daf0ddf48174feeabc64fda1d3412ec3))

### Changed

- Add bottom border to top menu bar. ([2320cb0](https://github.com/slsfi/digital-edition-cms-vincent/commit/2320cb0c159651310e729ab5b5da2715491d5826))
- Remove top divider from navigation. ([ecf8426](https://github.com/slsfi/digital-edition-cms-vincent/commit/ecf8426bd3fdec5d0b583326c67897c45d2295ee))
- Deps: update `@angular` packages to 19.2.x. ([582662c](https://github.com/slsfi/digital-edition-cms-vincent/commit/582662c4f51bbbb6834940b4d8701f582c091aef))
- Deps (dev): update `angular-eslint` to 19.3.0. ([f4868b2](https://github.com/slsfi/digital-edition-cms-vincent/commit/f4868b2a7616891bf520cb6cda9e6dbe19ed49d5))
- Deps (dev): update `eslint` to 9.23.0. ([043de7a](https://github.com/slsfi/digital-edition-cms-vincent/commit/043de7aec693d4c9b14e27c55f8264f4a5ce1e66))
- Deps (dev): update `typescript` to 5.8.2. ([93e2018](https://github.com/slsfi/digital-edition-cms-vincent/commit/93e201823e8d7941d6ff66c23260794e33a65e61))
- Deps (dev): update `typescript-eslint` to 8.27.0. ([efa5a84](https://github.com/slsfi/digital-edition-cms-vincent/commit/efa5a8486d3d7d5a89b6eea2d06449849ffb57c1))

### Fixed

- Custom table: zero values not shown in cells. ([0cb5fe8](https://github.com/slsfi/digital-edition-cms-vincent/commit/0cb5fe85e1af08f94e358433ac44cfaca7b20dbc))
- Dockerfile: bump Angular CLI major version. ([cac8f77](https://github.com/slsfi/digital-edition-cms-vincent/commit/cac8f77f5f6cdb30a5a816992d88abd5316d764e))
- Linting: no output bindings named as standard DOM events. ([c4bf119](https://github.com/slsfi/digital-edition-cms-vincent/commit/c4bf119863c6009ab86596124df725cef4b6741a))



## [1.1.2] – 2025-03-25

### Changed

- Deps: update `@angular/cli` and `@angular-devkit/build-angular` to 18.2.15. ([d52a940](https://github.com/slsfi/digital-edition-cms-vincent/commit/d52a9402e2319a48b4307a87f5a9bc22106c3ee2))

### Fixed

- Custom table: file path fields with empty values cause table breaks. ([2e92489](https://github.com/slsfi/digital-edition-cms-vincent/commit/2e924896f1f64d77d740a9a331286e34e9056228))
- Handling of empty form field values in publication linked text dialogs. ([baf3aa1](https://github.com/slsfi/digital-edition-cms-vincent/commit/baf3aa1f10cfbf579bfbe093e3ee65dd43b290d7))



## [1.1.1] – 2025-03-13

### Changed

- Switch 'Review' value on 'published' field to 'Internally'. ([2b0590e](https://github.com/slsfi/digital-edition-cms-vincent/commit/2b0590e6140770835a42280157f1ecdbedecd3df))



## [1.1.0] – 2025-03-13

### Added

- Add multiple publications: add buttons for removing publication rows. ([0a36772](https://github.com/slsfi/digital-edition-cms-vincent/commit/0a367728bc49836304790d1de48b39668d8721a5))

### Changed

- Update `nginx` to 1.27.4 and `Node.js` to 22. ([c58e6e0](https://github.com/slsfi/digital-edition-cms-vincent/commit/c58e6e0cc5a815ac11ec7e48f13c8987633992bf))
- Deps: update `@angular/cli` and `@angular-devkit/build-angular` to 18.2.14. ([8de9450](https://github.com/slsfi/digital-edition-cms-vincent/commit/8de9450a5cc97be487970b2ddc20bda336e3c620))
- Deps: update `rxjs` to 7.8.2. ([b14f269](https://github.com/slsfi/digital-edition-cms-vincent/commit/b14f26966c89be457399003f69343881e499e957))
- Deps (dev): update `@types/jasmine` to 5.1.7. ([8a29098](https://github.com/slsfi/digital-edition-cms-vincent/commit/8a29098e3df4c787b0ff37a5f91a56dc3aafbb24))
- Deps (dev): update `angular-eslint` to 18.4.3. ([a44ca77](https://github.com/slsfi/digital-edition-cms-vincent/commit/a44ca77472ec2df7e64736e1c48d51463065d69b))
- Deps (dev): update `eslint` to 9.22.0. ([2f04511](https://github.com/slsfi/digital-edition-cms-vincent/commit/2f04511a957e335072c9ef837ef77d0ff2b45baf))
- Deps (dev): update `jasmine-core` to 5.6.0. ([df7bcf1](https://github.com/slsfi/digital-edition-cms-vincent/commit/df7bcf136168fe3794c294d996233d04f654019f))
- Deps: update transitive dependencies. ([9d59f29](https://github.com/slsfi/digital-edition-cms-vincent/commit/9d59f293332f3dbf089d7e311fdf41646347eaf0))



## [1.0.3] – 2024-11-27

### Changed

- Add multiple publications: disable button for getting metadata from XML while fetch in progress. ([96508f9](https://github.com/slsfi/digital-edition-cms-vincent/commit/96508f933206cec1092ece33f98ac4ad356f9639))
- Add multiple publications: show number of added XML files. ([4dc554a](https://github.com/slsfi/digital-edition-cms-vincent/commit/4dc554ab19b4a984312d6fdebec7357c43a08120))
- Edit dialog: disable button for getting metadata from XML while fetch in progress. ([85110d6](https://github.com/slsfi/digital-edition-cms-vincent/commit/85110d64b1bc800b33b04b6f9af4cfe084567e0f))
- Home page: show notice about production database being used when environment set to `https://granska-api.sls.fi/`. ([8bc5281](https://github.com/slsfi/digital-edition-cms-vincent/commit/8bc528148fef5a31b38d626b0cb99c8ff8fb8600))
- Home page: disable button for updating git repository while update in progress. ([6dfbdb0](https://github.com/slsfi/digital-edition-cms-vincent/commit/6dfbdb0b95d9ea87ca230902e2d4a33a38efd4a1), [a734be0](https://github.com/slsfi/digital-edition-cms-vincent/commit/a734be021f65fb29077842be304391fde163a699))
- Deps: update multiple `@angular` packages to 18.2.13. ([47a3d55](https://github.com/slsfi/digital-edition-cms-vincent/commit/47a3d55fb5fda07c60f1e67bfd10b559a6f186e0))

### Fixed

- Typo in date created field name. ([a210af5](https://github.com/slsfi/digital-edition-cms-vincent/commit/a210af5da9f4a6dae525ba5862fbc944f6cddd6a))
- Edit dialog: allow getMetadata to update non-empty form fields with API data. ([8d0e468](https://github.com/slsfi/digital-edition-cms-vincent/commit/8d0e4685fcb7eb0969a1f158cffe8aeba7c6d9ee))



## [1.0.2] – 2024-11-26

### Changed

- Enable filtering on description field in index of persons. ([7a5a36b](https://github.com/slsfi/digital-edition-cms-vincent/commit/7a5a36b6212e68ddbd86a6a4af004f04b6a753a3))
- Preserve active sorting and filtering when selecting publication in publications list. ([27d58f0](https://github.com/slsfi/digital-edition-cms-vincent/commit/27d58f0d5df8d7274a0f886322bf1237803fc45b))
- Preserve active sorting and filtering when viewing images in a facsimile collection and returning to facsimile collection list. ([842b8a2](https://github.com/slsfi/digital-edition-cms-vincent/commit/842b8a28dd2591b42a4bd2817c2026c40efed494))
- Custom table component: move data subscription logic to ngOnInit. ([2ef8efb](https://github.com/slsfi/digital-edition-cms-vincent/commit/2ef8efb6c1ea43d3b60bb54a747302d0e35383e7))
- Custom table component: move static filterable columns initialization outside data subscription logic. ([173a681](https://github.com/slsfi/digital-edition-cms-vincent/commit/173a6810e1e6c1d59d1cdba916ce5098790ece82))
- Custom table component: apply highlight on table row on hover. ([4be624d](https://github.com/slsfi/digital-edition-cms-vincent/commit/4be624dacf726d73f79f90e39142e38e4b3f3f8c))
- Set default sorting of publication collections by name. ([78278ea](https://github.com/slsfi/digital-edition-cms-vincent/commit/78278eae8ea0e19bd58e15fdbd2e554de06a0dd6))
- Set displayed values of the 'published' field to 'Production' and 'Review' instead of 'Externally' and 'Internally'. Add visual highlight to further distinguish the values in tables. ([ff1ef2e](https://github.com/slsfi/digital-edition-cms-vincent/commit/ff1ef2e86120bbc44759fafc5bb7ea960631df25))
- Deps (dev): update `angular-eslint` to 18.4.2. ([8741d47](https://github.com/slsfi/digital-edition-cms-vincent/commit/8741d479755635dd1be668cf9ddd31a0836a1121))

### Fixed

- Filter name field in publications and publication collections, and external URL field in facsimile collections, on substring matches (opposed to exact matches). ([42068a9](https://github.com/slsfi/digital-edition-cms-vincent/commit/42068a9e220fb3fd6f5e1c7dd1d961354317dbf3))
- Remove external URL field from editable fields in edit facsimile dialog. ([148706d](https://github.com/slsfi/digital-edition-cms-vincent/commit/148706d6fe4e24dffabd37a2f72a70c83a9fbd02))
- Exclude the selected publication’s facsimiles, manuscripts and variants from filtering and sorting applied on the publications list. ([5155454](https://github.com/slsfi/digital-edition-cms-vincent/commit/51554544968fe34086a599e7ab2ac973921999b5))
- Custom table component: restore original table data on sort reset. ([f9733ad](https://github.com/slsfi/digital-edition-cms-vincent/commit/f9733ad616a7e9099bbda2b109f36598d1039caa))



## [1.0.1] – 2024-11-22

### Changed

- Simplify generation of file with app version. ([8d56f10](https://github.com/slsfi/digital-edition-cms-vincent/commit/8d56f10be55e7620c4c8f98972cc3955302347c9))

### Fixed

- Handle Angular routing in nginx to prevent 404 on refresh. ([d631417](https://github.com/slsfi/digital-edition-cms-vincent/commit/d63141783ebe78e16770dd252610aca5b144b49a))



## [1.0.0] – 2024-11-22

Initial release.



[unreleased]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.2.2...HEAD
[1.2.2]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.2.1...1.2.2
[1.2.1]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.1.2...1.2.0
[1.1.2]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.1.1...1.1.2
[1.1.1]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.3...1.1.0
[1.0.3]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/slsfi/digital-edition-cms-vincent/releases/tag/1.0.0
