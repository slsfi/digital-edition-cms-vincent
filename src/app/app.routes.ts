import { Routes } from '@angular/router';
import { ProjectsComponent } from './pages/projects/projects.component';
import { TextsComponent } from './pages/texts/texts.component';
import { FacsimilesComponent } from './pages/facsimiles/facsimiles.component';
import { PersonsComponent } from './pages/persons/persons.component';

export const routes: Routes = [
  { path: 'projects', component: ProjectsComponent },
  { path: 'texts', component: TextsComponent },
  { path: 'facsimiles', component: FacsimilesComponent },
  { path: 'persons', component: PersonsComponent },
];
