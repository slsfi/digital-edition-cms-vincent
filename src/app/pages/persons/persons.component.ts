import { Component } from '@angular/core';
import { catchError, combineLatest, map, Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { Person } from '../../models/person';
import { Project } from '../../models/project';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss'
})
export class PersonsComponent {

  $subjects: Observable<Person[]>;
  $selectedProject: Observable<Project | null>;

  constructor(private projectService: ProjectService) {
    this.$selectedProject = this.projectService.$selectedProject
    this.$subjects = combineLatest(this.$selectedProject, this.projectService.getSubjects())
      .pipe(
        map(([project, subjects]) => {
          return subjects;
        }),
      );

  }


}
