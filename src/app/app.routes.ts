import { Routes } from '@angular/router';
import { ProjectsComponent } from './pages/projects/projects.component';
import { FacsimilesComponent } from './pages/facsimiles/facsimiles.component';
import { PersonsComponent } from './pages/persons/persons.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { PublicationCollectionsComponent } from './pages/publication-collections/publication-collections.component';
import { NewPublicationFacsimileComponent } from './pages/new-publication-facsimile/new-publication-facsimile.component';
import { FacsimileCollectionComponent } from './pages/facsimile-collection/facsimile-collection.component';
import { FacsimileCollectionUploadBlockComponent } from './pages/facsimile-collection-upload-block/facsimile-collection-upload-block.component';
import { FacsimileCollectionUploadSelectionComponent } from './pages/facsimile-collection-upload-selected/facsimile-collection-upload-selected.component';
import { PublicationBundleComponent } from './pages/publication-bundle/publication-bundle.component';
import { AddFacsimileFromPublicationsComponent } from './pages/add-facsimile-from-publications/add-facsimile-from-publications.component';
import { TableOfContentsComponent } from './pages/table-of-contents/table-of-contents.component';
import { KeywordsComponent } from './pages/keywords/keywords.component';
import { KeywordLinkingComponent } from './pages/keyword-linking/keyword-linking.component';

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
  { path: 'facsimiles/:id', component: FacsimileCollectionComponent, canActivate: [authGuard] },
  { path: 'facsimiles/:id/upload-selection', component: FacsimileCollectionUploadSelectionComponent, canActivate: [authGuard] },
  { path: 'facsimiles/:id/:mode', component: FacsimileCollectionUploadBlockComponent, canActivate: [authGuard] },
  { path: 'keywords', component: KeywordsComponent, canActivate: [authGuard] },
  { path: 'keywords/linking', component: KeywordLinkingComponent, canActivate: [authGuard] },
  { path: 'persons', component: PersonsComponent, canActivate: [authGuard] },
  { path: 'table-of-contents', component: TableOfContentsComponent, canActivate: [authGuard] },
];
