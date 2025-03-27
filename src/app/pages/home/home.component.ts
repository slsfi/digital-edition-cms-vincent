import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, map, Observable, of, switchMap, take } from 'rxjs';

import { APP_VERSION } from '../../../config/app-version';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { navigationItems } from '../../models/common';
import { Project, RepoDetails } from '../../models/project';
import { ApiService } from './../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'home',
  imports: [
    CommonModule, MatSelectModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatListModule, RouterLink,
    MatDividerModule, LoadingSpinnerComponent, MatCardModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  appVersion = APP_VERSION;
  availableProjects$: Observable<Project[]>;
  environment$: Observable<string | null> = new Observable<string | null>();
  loading$;
  navItems = navigationItems.filter((item) => item.route !== '/');
  repoDetails$: Observable<RepoDetails | null>;
  selectedProject$;
  syncingRepo = false;

  readonly panelOpenState = signal(false);

  constructor(
    private apiService: ApiService,
    private loadingService: LoadingService,
    private projectService: ProjectService,
    private snackbar: MatSnackBar
  ) {
    this.environment$ = this.apiService.environment$;
    this.loading$ = this.loadingService.loading$;
    this.availableProjects$ = this.projectService.getProjects().pipe(
      map((projects) => projects.sort((a, b) => a.name.localeCompare(b.name)))
    );
    this.selectedProject$ = this.projectService.selectedProject$;
    this.repoDetails$ = this.selectedProject$.pipe(
      switchMap(() =>
        this.projectService.getGitRepoDetails().pipe(
          catchError(() => of(null))
        )
      )
    );
  }

  changeProject(event: MatSelectChange) {
    this.projectService.setSelectedProject(event.value);
  }

  pullRepo() {
    this.syncingRepo = true;
    this.projectService.pullChangesFromGitRemote().pipe(
      take(1),
      finalize(() => {
        this.syncingRepo = false;
      })
    )
    .subscribe({
      next: () => {
        this.snackbar.open('Repository successfully updated', 'Close', { panelClass: 'snackbar-success' });
      }
    });
  }

}
