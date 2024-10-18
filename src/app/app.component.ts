import { LoadingService } from './services/loading.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { filter, map, Observable } from 'rxjs';
import { ProjectService } from './services/project.service';
import { TopbarComponent } from './components/topbar/topbar.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { LoadingIndicatorComponent } from "./components/loading-indicator/loading-indicator.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatProgressSpinnerModule, MatSidenavModule, TopbarComponent, NavigationComponent, LoadingIndicatorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isAuthenticated$: Observable<boolean> = new Observable<boolean>();
  currentUrl$: Observable<string> = new Observable<string>();
  selectedProject$: Observable<string | null> = new Observable<string | null>();

  constructor(private authService: AuthService, private projectService: ProjectService, private router: Router) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  ngOnInit() {
    this.currentUrl$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url));
  }
}
