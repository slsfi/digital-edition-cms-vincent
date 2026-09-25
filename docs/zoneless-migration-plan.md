# Angular Zoneless and Default-OnPush Migration Plan

## Goal

Migrate the Angular 22.2 application to zoneless change detection and the Angular 22 default `OnPush` change-detection strategy while keeping the behavioral changes as small as possible.

The final state must:

- have no runtime or test dependency on `zone.js`;
- have no `provideZoneChangeDetection()` provider;
- have no explicit `changeDetection` declarations, because `OnPush` is the Angular 22 default;
- preserve the existing observable, `BehaviorSubject`, and `AsyncPipe` design;
- preserve reactive forms rather than replacing them with Signal Forms;
- use signals for template-visible imperative state that is changed outside an Angular-bound listener or another existing notification source;
- retain current user-visible behavior.

## Migration rules

Angular schedules zoneless change detection when an Angular notification source fires. The notification sources relevant to this application are:

- a signal read by a template is updated;
- an `AsyncPipe` receives a value and calls `markForCheck()`;
- an input binding is updated;
- a bound template, host, or component-output listener runs;
- a view is attached or removed.

Apply the following rules throughout the migration:

1. Keep observable values consumed through `AsyncPipe` as observables. Do not convert them to signals only for this migration.
2. Keep `BehaviorSubject` reload triggers. A subject emission that eventually reaches an `AsyncPipe` is already a valid notification path.
3. Keep reactive forms. User-driven form events are safe. When an asynchronous callback changes form state programmatically, ensure that the same operation also updates a template-read signal or otherwise produces an `AsyncPipe` notification.
4. Plain fields that only change synchronously in bound event handlers can remain plain fields.
5. Convert plain template state changed by `subscribe`, `finalize`, delayed RxJS operators, timers, or deferred dialog callbacks to signals unless an existing explicit notification path is clear and tested.
6. Remove `changeDetection: ChangeDetectionStrategy.Eager` from a component in the same commit that makes the component `OnPush`-compatible. Also remove the now-unused `ChangeDetectionStrategy` import.
7. Remove the existing explicit `ChangeDetectionStrategy.OnPush` from `KeywordsComponent`; the declaration is redundant in Angular 22.
8. Do not place an unconverted explicit-Eager component behind a default-OnPush application component. An unnotified Eager descendant would not be reached through a clean OnPush ancestor during a Zone-triggered traversal. In particular, keep `AppComponent` explicit-Eager until every descendant is compatible, keep `FileTreeDialogComponent` explicit-Eager until `FileTreeComponent` is migrated in Commit 2, and keep `FacsimileCollectionUploadBlockComponent` explicit-Eager until `FileUploadComponent` is migrated in Commit 4.
9. Keep Zone.js installed and keep `provideZoneChangeDetection()` until all component commits are complete. This keeps every intermediate commit runnable. Because each migrated component is already default-OnPush and does not host an unconverted Eager application subtree, focused tests can still expose missing component notifications before the final zoneless cutover.

## Current baseline

- Angular packages: `22.2.0`
- Components: 35 total
  - 34 explicitly use `ChangeDetectionStrategy.Eager`
  - 1 explicitly uses `ChangeDetectionStrategy.OnPush`
- `zone.js` is loaded by the application and testing polyfills.
- `provideZoneChangeDetection({ eventCoalescing: true })` is registered in `src/app/app.config.ts`.
- No application code uses `NgZone`, `ApplicationRef.tick`, or `ChangeDetectorRef.detectChanges()`/`markForCheck()`.
- No tests use `fakeAsync`, `tick`, `flush`, `flushMicrotasks`, or `waitForAsync`.
- The application has no SSR target, so no `PendingTasks` migration is required.
- Planning baseline on 2026-09-24:
  - `npm run lint`: passes
  - `npm test -- --watch=false`: 38 test files and 114 tests pass
- Before migration work starts, record successful results for:
  - `npm run lint`
  - `npm test -- --watch=false`
  - `npm run build`

## Test pattern for component commits

Every component commit must test the notification path rather than forcing a refresh after the asynchronous action:

1. Create and initially render the fixture as usual.
2. Trigger or emit the mocked observable, HTTP event, timer, router event, or dialog result.
3. Use `await fixture.whenStable()` or Vitest timers as appropriate.
4. Assert the rendered DOM without calling another `fixture.detectChanges()` after the asynchronous state change.

An initial `fixture.detectChanges()` may remain in existing tests. Avoid adding `fakeAsync`; it requires Zone.js and is incompatible with the current Vitest runner.

## Commit 1: Make already-compatible components use the default strategy

Suggested commit:

`refactor(change-detection): use default OnPush for compatible components`

Remove the explicit `changeDetection` option and unused `ChangeDetectionStrategy` imports from components whose state is already driven by inputs, signals, `AsyncPipe`, initialization, or bound listeners. This should include:

- `TopbarComponent`
- `LoadingSpinnerComponent`
- `ConfirmDialogComponent`
- `AutoGenerateTocDialogComponent`
- `EditNodeDialogComponent`
- `EditKeywordDialogComponent`
- `EditTocRootDialogComponent`
- `TableFiltersComponent`
- `TableSortingComponent`
- `LoginComponent`
- `KeywordsComponent`, including removal of its redundant explicit `OnPush`
- `KeywordLinkingComponent`
- `AddFacsimileToPublicationComponent`
- `FacsimileCollectionComponent`
- `FacsimileCollectionsComponent`
- `PersonsComponent`
- `ProjectsComponent`
- `PublicationCollectionsComponent`

Do not include the components assigned to later commits, even if their decorator change is mechanically simple.

Tests:

- Run affected existing component specs.
- In a zoneless TestBed, verify that toggling an auto-generated TOC field through `ngModel` updates the rendered control and dialog result without a forced `detectChanges()`.
- In a zoneless TestBed, verify that confirmation-dialog scalar and indexed `ngModel` toggles are returned by the confirm action without a forced `detectChanges()`.
- In a zoneless TestBed, verify that the edit-node autocomplete renders a debounced result and that selecting it updates the dependent fields without a forced `detectChanges()`.
- In a zoneless TestBed, verify that asynchronously supplied keyword categories render, initialize the category form control, and are included in the submitted result without a forced `detectChanges()`.
- Add a regression test only if an affected component has an asynchronous UI transition that is not already exercised.
- Run the standard commit gate.

## Commit 2: Convert small asynchronous UI state to signals

Suggested commit:

`refactor(change-detection): signal async component state`

Convert the following template-visible fields and update their templates to call the signals:

- `NavigationComponent.currentUrl`
- `HomeComponent.syncingRepo`
- `FileTreeComponent.dataSource`
- `FileTreeComponent.loading`
- `EditDialogComponent.gettingMetadata`
- `AddPublicationsFromFilesComponent.gettingMetadata`
- `PublicationsComponent.metadataUpdating`
- `AddFacsCollectionsFromPublicationsComponent.isProcessing`
- `AddFacsCollectionsFromPublicationsComponent.creationSummary`
- `FacsimileCollectionUploadBlockComponent.mode`

Keep these related values plain because they are either internal or only changed by bound listeners:

- file-tree selection and output-observation flags;
- metadata failure arrays used only to construct snackbar messages;
- existing-file-path load state used only as a guard in user-triggered methods;
- the bulk-facsimile progress message, which is assigned synchronously by the submit listener.

For programmatic form updates in metadata callbacks, the accompanying `gettingMetadata` signal update must remain in the same operation so the form directives are checked after the update.

Remove the explicit `Eager` declaration from every component changed in this commit except `FacsimileCollectionUploadBlockComponent`. It must remain an eager compatibility boundary until its `FileUploadComponent` child is migrated in Commit 4; otherwise HTTP progress callbacks in the eager child can be skipped behind the clean default-OnPush host.

After `FileTreeComponent` uses signals for its asynchronously loaded state, remove the explicit `Eager` declaration and unused `ChangeDetectionStrategy` import from `FileTreeDialogComponent`. The dialog must remain eager until then because a clean default-OnPush dialog would prevent its unnotified Eager child from being reached by Zone-triggered traversal.

Tests:

- router-event updates render the active navigation entry;
- repository-sync completion re-enables the action;
- file-tree data and loading state render after service emission;
- in a zoneless integration test, a delayed file-tree service emission removes the dialog spinner and renders tree nodes, and selecting a node updates the displayed path and dialog result without a forced `detectChanges()`;
- metadata completion updates the form and button/spinner state;
- bulk facsimile success and error paths render completion state.

## Commit 3: Make shared tables and translations default-OnPush safe

Suggested commit:

`refactor(tables): notify default OnPush views`

### `CustomTableComponent`

- Convert `originalCount` and `filteredCount` to signals.
- Keep `MatTableDataSource`, the input observable, query-parameter observables, and internal snapshots unchanged.
- Update the count bindings in the template.
- Ensure the signal updates occur in the same pipeline turn as `tableDataSource.data` assignment so the scheduled check sees the final table state.

### `PublicationKeywordTableComponent`

- Introduce template-read signals for total and filtered row counts instead of reading mutable `MatTableDataSource` count fields directly in the heading.
- Update those count signals when the input effect supplies publications and when the debounced filter subscription changes the filter.
- React to `viewChild()` paginator and sort signals with effects, rather than reading them only once before the view queries are guaranteed to exist.
- Keep `MatTableDataSource` and the debounced reactive-form stream.

### `TranslationsComponent`

- Move form and `fieldTranslations$` setup from `ngAfterViewInit` to `ngOnInit`. Inputs are available by `ngOnInit`, and the template's initial `AsyncPipe` must subscribe to the final observable instead of the placeholder `of([])` stream.
- Keep `fieldTranslations$`, `translationLoader$`, and the existing `AsyncPipe`.
- Keep `filteredLanguages` plain: it changes in `tap` immediately before the observable reaches `AsyncPipe`, which supplies the notification.
- Keep `translationId` plain: the save callback immediately emits through `translationLoader$`, which refreshes the `AsyncPipe` consumer.

Remove the explicit `Eager` declaration from these three components.

Tests:

- table data, filtered count, total count, sorting, and paginator wiring update without a forced post-emission `detectChanges()`;
- delayed search filtering updates the publication-table heading using Vitest timers;
- translations load on the initial render and refresh after add/edit.

## Commit 4: Make both upload workflows default-OnPush safe

Suggested commit:

`refactor(uploads): signal upload progress state`

### `FileUploadComponent`

- Convert `FileQueueObject.status` and `FileQueueObject.progress` to signals. These fields currently mutate during HTTP upload events without a corresponding `uploadQueue$` emission and therefore directly depend on Zone-based checks.
- Convert `uploadInProgress` and `uploadFinished` to signals.
- Keep `uploadQueue$` and its `AsyncPipe`; it still owns queue membership.
- Update `isUploadable()` and the template for signal reads.
- Treat a batch as successful only when every file succeeds. Keep failed files retryable and emit `filesUploaded` only after the complete queue has succeeded.
- Cancel the aggregate upload subscription, preserve completed rows, and reset only active rows so a later upload resumes unfinished work without duplicating successful requests.

After `FileUploadComponent` uses signals for its asynchronous progress state, remove the explicit `Eager` declaration and unused `ChangeDetectionStrategy` import from `FacsimileCollectionUploadBlockComponent`.

### `FacsimileCollectionUploadSelectionComponent`

- Convert `uploadInProgress` and `uploadFinished` to signals.
- Keep queue-item status and progress as plain values because every asynchronous mutation already emits through `uploadQueue$`, which is consumed by `AsyncPipe`.
- Keep the reactive `FormArray`; its row changes are user-event driven.
- Keep failed and cancelled rows retryable, prevent retry controls while a batch is active, and show completion navigation only after every queued replacement succeeds.

Remove the explicit `Eager` declaration from both upload components and from `FacsimileCollectionUploadBlockComponent`.

Tests:

- render intermediate upload progress and each terminal status;
- render completion and error/retry state for both one-file and mixed two-file batches;
- verify cancellation preserves completed rows, resets active rows, and resumes only unfinished uploads;
- verify failed child uploads do not trigger host-level completion navigation;
- assert DOM changes after mocked HTTP events without an additional `fixture.detectChanges()`.

## Commit 5: Convert table-of-contents page state to signals

Suggested commit:

`refactor(toc): signal asynchronous page state`

In `TableOfContentsComponent`, convert these template-visible fields to signals:

- `collections`
- `currentToc`
- `isLoading`
- `isSaving`
- `hasUnsavedChanges`
- `isGeneratingFlatToc`
- `isUpdatingFromDb`
- `publicationsForSelectedCollection`
- `tocVariantsByCollectionId`
- `currentTocLanguage`
- `tocLanguageSelection`

Implementation constraints:

- Use `set`/`update` rather than mutating signal-held top-level state without notifying it.
- Update the TOC-variant map immutably when a save creates a new universal or language-specific variant.
- Keep `projectName`, `selectedCollection`, and `selectedCollectionId` plain unless implementation proves a signal is necessary; they are initialized before first render or changed by bound selection listeners.
- Keep the committed `selectedCollection` plain, but use a signal for the collection selector's tentative value so a cancelled unsaved-changes confirmation can restore the committed collection in a default-OnPush view.
- Keep publication and TOC service calls as observables.
- Cancel superseded collection-dependent publication and TOC loads with `switchMap`, and disable both selectors while loads, saves, generation, or database updates are active.
- Capture the collection, language, TOC reference, and change revision at save start. Attribute the result to that captured target, clear dirty state only if no newer changes exist, and disable all TOC mutation controls and drag targets while saving.
- Keep the existing mutable `TocRoot` data model for this migration.
- Update all method and template reads consistently.

Remove the page's explicit `Eager` declaration, but leave `TocTreeComponent` explicit-Eager until Commit 6.

Tests:

- initial collection and variant loading;
- publication-list loading;
- TOC load success and 404/error states;
- save success/error and variant-map update;
- language-change confirmation and cancellation;
- collection-change confirmation and cancellation when there are unsaved changes;
- selector disabling during active work and stale-response protection for rapid collection changes;
- captured save-target handling and read-only TOC-tree behavior while saving;
- safe database-update error cleanup, including responses without an error body;
- real-child zoneless integration coverage proving `TocTreeComponent.tocChanged` updates the default-OnPush parent view;
- auto-generation and database-update success/error;
- new TOC and dirty-state transitions.

Each test should verify rendered state after the observable or dialog result without a forced refresh.

## Commit 6: Make the mutable TOC tree default-OnPush safe

Suggested commit:

`refactor(toc): support default OnPush tree mutations`

`TocTreeComponent` intentionally mutates the `TocRoot` input and nested node objects. Replacing this model with immutable tree operations would substantially expand the migration, so preserve the model and add the smallest explicit signal notification:

- Add a private/internal tree-revision signal that is read once by the template.
- Increment the revision in `runNodeChangedActions()` after structural or node mutations.
- Increment it after root-property edits, which do not use `runNodeChangedActions()`.
- Keep direct DOM-only drag indicator state and caches plain.
- Keep expansion changes made directly by bound drag/click listeners plain because those listeners already mark the component.
- Keep `tocChanged` so the parent still marks the TOC as unsaved.
- Document why the revision signal exists: it notifies the default-OnPush view after deferred dialog and timer callbacks mutate the nested input model.

Remove the component's explicit `Eager` declaration.

After `TocTreeComponent` and all other descendants are default-OnPush compatible, remove the explicit `Eager` declaration and unused `ChangeDetectionStrategy` import from `AppComponent`. Keeping the root eager until this point ensures that an unconverted explicit-Eager descendant is not hidden behind a clean default-OnPush root during intermediate commits. Removing the root strategy here, while Zone.js is still installed, also keeps the root traversal change separate from the Zone.js removal in Commit 7.

Tests:

- dialog-driven node edit/add/delete updates the rendered tree;
- root-property dialog updates the header;
- deferred drag/drop rebuild updates IDs and ordering using Vitest timers;
- parent dirty state is still emitted;
- collapse, expand, and node toggles continue to render.
- application-shell navigation and routed content still render with the implicit default-OnPush root.

After this commit, verify that no component contains `changeDetection:` or imports `ChangeDetectionStrategy`.

## Commit 7: Remove Zone.js and use Angular 22 zoneless defaults

Suggested commit:

`refactor(change-detection): remove Zone.js`

Make the cutover atomically:

1. Remove `provideZoneChangeDetection` from `src/app/app.config.ts` and remove its import.
2. Do not add `provideZonelessChangeDetection`; zoneless and `OnPush` are Angular 22 defaults.
3. Remove `zone.js` from the application polyfills in `angular.json`.
4. Remove `zone.js` and `zone.js/testing` from testing polyfills.
5. Run `npm uninstall zone.js` to update `package.json` and `package-lock.json`.
6. Confirm that `npm ls zone.js --all` does not show an installed direct package. Angular core may still declare an optional peer range in its package metadata; that does not require installation.

Tests and verification:

- `npm run lint`
- `npm test -- --watch=false`
- `npm run build`
- `rg -n "zone\\.js|provideZoneChangeDetection|provideZonelessChangeDetection|ChangeDetectionStrategy|changeDetection:" package.json package-lock.json angular.json src`

The search should return no application configuration, dependency, or component strategy declarations. An optional peer-dependency string inside installed Angular package metadata is not part of the repository result.

## Final diagnostic and manual verification

Before merging, temporarily add `provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 })` in a local-only diagnostic run. Exercise the application, fix any unnotified binding mutation it exposes, and remove the provider before committing.

Manual smoke-test checklist:

- login, custom environment validation, browser autofill, and password visibility;
- active navigation state and route changes;
- project selection and repository synchronization;
- file-tree loading and file/folder selection;
- publication, person, project, collection, facsimile, translation, and keyword CRUD dialogs;
- XML metadata retrieval in a dialog and in the bulk-add page;
- table filtering, sorting, pagination, selection, and count labels;
- missing/all/selected facsimile upload flows, including progress, cancel, failure, retry, and completion;
- TOC collection/language selection, load, edit, drag/drop, generate, update, reload, save, and unsaved-change confirmation.

## Standard commit gate

Run these commands for every migration commit:

```text
npm run lint
npm test -- --watch=false
```

Additionally run `npm run build` after Commit 1, Commit 6, and Commit 7. If a focused test is added for a component, run that focused test before the full suite.

## Completion criteria

The migration is complete when:

- all seven commits are independently green;
- all 35 components use Angular 22's implicit default `OnPush` strategy;
- no template-visible asynchronous mutation relies on a Zone-triggered global check;
- observable and reactive-form architecture remains intact;
- Zone.js is absent from application, tests, dependencies, and lockfile installation entries;
- lint, all unit tests, production build, exhaustive local diagnostics, and the manual smoke checklist pass.

## Angular references

- [Zoneless guide](https://angular.dev/guide/zoneless)
- [`ChangeDetectionStrategy` API](https://angular.dev/api/core/ChangeDetectionStrategy)
- [Skipping component subtrees and default `OnPush`](https://angular.dev/best-practices/skipping-subtrees)
- [Component testing scenarios](https://angular.dev/guide/testing/components-scenarios)
- [`provideCheckNoChangesConfig` API](https://angular.dev/api/core/provideCheckNoChangesConfig)
