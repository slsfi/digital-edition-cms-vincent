import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { AddFacsCollectionsFromPublicationsComponent } from './pages/add-facs-collections-from-publications/add-facs-collections-from-publications.component';
import { FacsimileCollectionComponent } from './pages/facsimile-collection/facsimile-collection.component';
import { FacsimileCollectionUploadBlockComponent } from './pages/facsimile-collection-upload-block/facsimile-collection-upload-block.component';
import { FacsimileCollectionUploadSelectionComponent } from './pages/facsimile-collection-upload-selection/facsimile-collection-upload-selection.component';
import { FacsimileCollectionsComponent } from './pages/facsimile-collections/facsimile-collections.component';
import { HomeComponent } from './pages/home/home.component';
import { KeywordsComponent } from './pages/keywords/keywords.component';
import { KeywordLinkingComponent } from './pages/keyword-linking/keyword-linking.component';
import { LoginComponent } from './pages/login/login.component';
import { AddFacsimileToPublicationComponent } from './pages/add-facsimile-to-publication/add-facsimile-to-publication.component';
import { PersonsComponent } from './pages/persons/persons.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { AddPublicationsFromFilesComponent } from './pages/add-publications-from-files/add-publications-from-files.component';
import { PublicationCollectionsComponent } from './pages/publication-collections/publication-collections.component';
import { TableOfContentsComponent } from './pages/table-of-contents/table-of-contents.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [authGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [authGuard] },
  { path: 'publication-collections', component: PublicationCollectionsComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId', component: PublicationCollectionsComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId/add-publications-from-files', component: AddPublicationsFromFilesComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId/publication/:publicationId', component: PublicationCollectionsComponent, canActivate: [authGuard] },
  { path: 'publication-collections/:collectionId/publication/:publicationId/add-facsimile', component: AddFacsimileToPublicationComponent, canActivate: [authGuard] },
  { path: 'facsimile-collections', component: FacsimileCollectionsComponent, canActivate: [authGuard] },
  { path: 'facsimile-collections/add-from-publications', component: AddFacsCollectionsFromPublicationsComponent, canActivate: [authGuard] },
  { path: 'facsimile-collections/:id/upload-selection', component: FacsimileCollectionUploadSelectionComponent, canActivate: [authGuard] },
  { path: 'facsimile-collections/:id/upload-missing', component: FacsimileCollectionUploadBlockComponent, canActivate: [authGuard], data: { mode: 'missing' } },
  { path: 'facsimile-collections/:id/upload-all', component: FacsimileCollectionUploadBlockComponent, canActivate: [authGuard], data: { mode: 'all' } },
  { path: 'facsimile-collections/:id', component: FacsimileCollectionComponent, canActivate: [authGuard] },
  { path: 'keywords', component: KeywordsComponent, canActivate: [authGuard] },
  { path: 'keywords/linking', component: KeywordLinkingComponent, canActivate: [authGuard] },
  { path: 'persons', component: PersonsComponent, canActivate: [authGuard] },
  { path: 'table-of-contents', component: TableOfContentsComponent, canActivate: [authGuard] },
];
