import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  $projects: Observable<Project[]> = new Observable<Project[]>();

  constructor(private projectService: ProjectService) {
    this.$projects = this.projectService.getProjects();
  }



}
