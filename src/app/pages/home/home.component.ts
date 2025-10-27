import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, map, Observable, of, switchMap, take,
         tap } from 'rxjs';

import { APP_VERSION } from '../../../config/app-version';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { navigationItems } from '../../models/common.model';
import { Project, RepoDetails } from '../../models/project.model';
import { ApiService } from './../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';


@Component({
  selector: 'home',
  imports: [
    CommonModule, RouterLink, MatSelectModule, MatFormFieldModule, MatButtonModule,
    MatIconModule, MatListModule, MatDividerModule, MatCardModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly snackbar = inject(MatSnackBar);

  availableProjects$: Observable<Project[]> = of([]);
  environment$ = this.apiService.environment$;
  loading$ = this.loadingService.loading$
  repoDetails$: Observable<RepoDetails | null> = of(null);
  selectedProject$ = this.projectService.selectedProject$;

  appVersion = APP_VERSION;
  navItems = navigationItems.filter((item) => item.route !== '/');
  syncingRepo = false;
  readonly panelOpenState = signal(false);

  ngOnInit(): void {
    this.availableProjects$ = this.projectService.getProjects().pipe(
      map(projects => projects.sort((a, b) => a.name.localeCompare(b.name))),

      // Run auto-select of project as a side-effect so the template's
      // single subscription triggers it. Only if exactly 1 project
      // and the project is not selected yet.
      tap(projects => {
        if (
          projects.length === 1 &&
          !this.projectService.getCurrentProject()
        ) {
          this.projectService.setSelectedProject(projects[0].name);
        }
      })
    );

    this.repoDetails$ = this.selectedProject$.pipe(
      switchMap(project => {
        if (!project) { return of(null); }
        return this.projectService.getGitRepoDetails(project).pipe(
          catchError(() => of(null))
        );
      })
    );
  }

  changeProject(event: MatSelectChange) {
    this.projectService.setSelectedProject(event.value);
  }

  pullRepo() {
    this.syncingRepo = true;
    const currentProject = this.projectService.getCurrentProject();
    this.projectService.pullChangesFromGitRemote(currentProject).pipe(
      take(1),
      finalize(() => {
        this.syncingRepo = false;
      })
    )
    .subscribe({
      next: () => {
        this.snackbar.open('Repository successfully updated', 'Close', { panelClass: 'snackbar-success' });

        // Clear the cached file tree by setting it to null
        this.projectService.fileTree$.next(null);
      }
    });
  }

}
