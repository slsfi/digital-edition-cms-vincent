import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { HomeComponent } from './components/home/home.component';
import { CommonModule } from '@angular/common';
import { filter, map, Observable } from 'rxjs';
import { ProjectService } from './services/project.service';
import { ApiService } from './services/api.service';
import { TopbarComponent } from './components/topbar/topbar.component';
import { NavigationComponent } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, HomeComponent, CommonModule, MatProgressSpinnerModule, MatSidenavModule, TopbarComponent, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isAuthenticated$: Observable<boolean> = new Observable<boolean>();
  currentUrl$: Observable<string> = new Observable<string>();
  selectedProject$: Observable<string | null> = new Observable<string | null>();
  loading$: Observable<boolean> = new Observable<boolean>();

  constructor(private authService: AuthService, private projectService: ProjectService, private router: Router, private apiService: ApiService) {
    this.isAuthenticated$ = this.authService.$isAuthenticated;
    this.selectedProject$ = this.projectService.$selectedProject;
    this.loading$ = this.apiService.$loading;
  }

  ngOnInit() {
    this.currentUrl$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url));
  }
}
