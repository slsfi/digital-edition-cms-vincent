import { Routes } from '@angular/router';
import { ProjectsComponent } from './pages/projects/projects.component';
import { TextsComponent } from './pages/texts/texts.component';
import { FacsimilesComponent } from './pages/facsimiles/facsimiles.component';
import { PersonsComponent } from './pages/persons/persons.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [authGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [authGuard] },
  { path: 'texts', component: TextsComponent, canActivate: [authGuard] },
  { path: 'facsimiles', component: FacsimilesComponent, canActivate: [authGuard] },
  { path: 'persons', component: PersonsComponent, canActivate: [authGuard] },
];
