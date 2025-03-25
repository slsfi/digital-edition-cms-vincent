# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).



## [Unreleased]

### Changed

- Deps: update `@angular/cli` and `@angular-devkit/build-angular` to 18.2.15.

### Fixed

- Custom table: file path fields with empty values cause table breaks.



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



[unreleased]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.1.1...HEAD
[1.1.1]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.1.0...1.1.1
[1.1.0]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.3...1.1.0
[1.0.3]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/slsfi/digital-edition-cms-vincent/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/slsfi/digital-edition-cms-vincent/releases/tag/1.0.0
