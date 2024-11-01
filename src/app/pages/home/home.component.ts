import { Component } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { map, Observable } from 'rxjs';
import { Project } from '../../models/project';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { navigationItems } from '../../models/common';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'home',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatListModule, RouterLink, MatDividerModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  availableProjects$: Observable<Project[]>;
  selectedProject$: Observable<string | null>;

  navItems = navigationItems.filter((item) => item.route !== '/');


  constructor(private projectService: ProjectService) {
    this.availableProjects$ = this.projectService.getProjects().pipe(
      map((projects) => projects.sort((a, b) => a.name.localeCompare(b.name)))
    );
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  changeProject(event: MatSelectChange) {
    this.projectService.setSelectedProject(event.value);
  }

}
