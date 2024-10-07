import { Component } from '@angular/core';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { EditProjectComponent } from '../../components/edit-project/edit-project.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  $loader: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  $projects: Observable<Project[]> = new Observable<Project[]>();
  displayedColumns: string[] = ['id', 'name', 'published', 'deleted', 'date_created', 'date_modified', 'actions'];

  constructor(private projectService: ProjectService, private dialog: MatDialog) {
    this.$projects = this.$loader.asObservable().pipe(
      switchMap(() => this.projectService.getProjects())
    )
  }

  editProject(project: Project | null = null) {
    const dialogRef = this.dialog.open(EditProjectComponent, {
      width: '250px',
      data: project ?? {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // force projects to reload
        this.$loader.next(0);
      }
    });
  }

}
