import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { Publication } from '../../models/publication';
import { Project } from '../../models/project';

@Component({
  selector: 'app-texts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './texts.component.html',
  styleUrl: './texts.component.scss'
})
export class TextsComponent {

  $publications: Observable<Publication[]> = new Observable<Publication[]>();
  $selectedProject: Observable<Project | null>;

  constructor(private projectService: ProjectService) {
    this.$selectedProject = this.projectService.$selectedProject;
    this.$publications = combineLatest(this.$selectedProject, this.projectService.getPublications())
      .pipe(
        map(([project, publications]) => {
          return publications;
        }),
      );

  }

}
