import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { AddFacsimileFromPublicationsComponent } from './pages/add-facsimile-from-publications/add-facsimile-from-publications.component';
import { FacsimileCollectionComponent } from './pages/facsimile-collection/facsimile-collection.component';
import { FacsimileCollectionUploadBlockComponent } from './pages/facsimile-collection-upload-block/facsimile-collection-upload-block.component';
import { FacsimileCollectionUploadSelectionComponent } from './pages/facsimile-collection-upload-selection/facsimile-collection-upload-selection.component';
import { FacsimilesComponent } from './pages/facsimiles/facsimiles.component';
import { HomeComponent } from './pages/home/home.component';
import { KeywordsComponent } from './pages/keywords/keywords.component';
import { KeywordLinkingComponent } from './pages/keyword-linking/keyword-linking.component';
import { LoginComponent } from './pages/login/login.component';
import { NewPublicationFacsimileComponent } from './pages/new-publication-facsimile/new-publication-facsimile.component';
import { PersonsComponent } from './pages/persons/persons.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { PublicationBundleComponent } from './pages/publication-bundle/publication-bundle.component';
import { PublicationCollectionsComponent } from './pages/publication-collections/publication-collections.component';
import { TableOfContentsComponent } from './pages/table-of-contents/table-of-contents.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [authGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [authGuard] },
  { path: 'publication-collections', component: PublicationCollectionsComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId', component: PublicationCollectionsComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId/bundle-add', component: PublicationBundleComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId/publication/:publicationId', component: PublicationCollectionsComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId/publication/:publicationId/facsimiles/new', component: NewPublicationFacsimileComponent, canActivate: [authGuard] },
  { path: 'facsimiles', component: FacsimilesComponent, canActivate: [authGuard] },
  { path: 'facsimiles/add-from-publications', component: AddFacsimileFromPublicationsComponent, canActivate: [authGuard] },
  { path: 'facsimiles/:id/upload-selection', component: FacsimileCollectionUploadSelectionComponent, canActivate: [authGuard] },
  { path: 'facsimiles/:id/upload-missing', component: FacsimileCollectionUploadBlockComponent, canActivate: [authGuard], data: { mode: 'missing' } },
  { path: 'facsimiles/:id/upload-all', component: FacsimileCollectionUploadBlockComponent, canActivate: [authGuard], data: { mode: 'all' } },
  { path: 'facsimiles/:id', component: FacsimileCollectionComponent, canActivate: [authGuard] },
  { path: 'keywords', component: KeywordsComponent, canActivate: [authGuard] },
  { path: 'keywords/linking', component: KeywordLinkingComponent, canActivate: [authGuard] },
  { path: 'persons', component: PersonsComponent, canActivate: [authGuard] },
  { path: 'table-of-contents', component: TableOfContentsComponent, canActivate: [authGuard] },
];
