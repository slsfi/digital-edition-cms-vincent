import { Component, signal } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { Project, RepoDetails } from '../../models/project';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { navigationItems } from '../../models/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../../services/loading.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'home',
  standalone: true,
  imports: [
    CommonModule, MatSelectModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatListModule, RouterLink,
    MatDividerModule, LoadingSpinnerComponent, MatCardModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  availableProjects$: Observable<Project[]>;
  selectedProject$;
  repoDetails$: Observable<RepoDetails | null>;
  loading$: Observable<boolean>;
  navItems = navigationItems.filter((item) => item.route !== '/');

  readonly panelOpenState = signal(false);

  constructor(private projectService: ProjectService, private snackbar: MatSnackBar, private loadingService: LoadingService) {
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
    this.projectService.pullChangesFromGitRemote().subscribe({
      next: () => {
        this.snackbar.open('Synced successfully', 'Close', { panelClass: 'snackbar-success' });
      }
    });
  }

}
