import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { HomeComponent } from './components/home/home.component';
import { CommonModule } from '@angular/common';
import { filter, map, Observable } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ProjectService } from './services/project.service';
import { ApiService } from './services/api.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Project } from './models/project';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, HomeComponent, CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isAuthenticated$: Observable<boolean> = new Observable<boolean>();
  availableProjects$: Observable<Project[]> = new Observable<Project[]>();
  selectedProject$: Observable<Project | null> = new Observable<Project>();
  currentUrl$: Observable<string> = new Observable<string>();
  loading$: Observable<boolean> = new Observable<boolean>();

  constructor(private authService: AuthService, private projectService: ProjectService, private router: Router, private apiService: ApiService) {
    this.isAuthenticated$ = this.authService.$isAuthenticated;
    this.availableProjects$ = this.projectService.getProjects();
    this.selectedProject$ = this.projectService.$selectedProject;
    this.loading$ = this.apiService.$loading;
  }

  ngOnInit() {
    this.currentUrl$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url));
  }


  logout() {
    this.authService.logout();
    this.projectService.setSelectedProject(null);
  }

  changeProject(event: MatSelectChange) {
    this.projectService.setSelectedProject(event.value);
  }
}
