import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { Project } from '../../models/project';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'navigation',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, MatDividerModule, MatListModule, MatIconModule, RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  @Output() onMenuToggle: EventEmitter<void> = new EventEmitter<void>();

  availableProjects$: Observable<Project[]>;
  selectedProject$: Observable<string | null>;

  constructor(private projectService: ProjectService, private authService: AuthService) {
    this.availableProjects$ = this.projectService.getProjects();
    this.selectedProject$ = this.projectService.$selectedProject;
   }

  logout() {
    this.authService.logout();
    this.projectService.setSelectedProject(null);
    localStorage.clear();
  }

  changeProject(event: MatSelectChange) {
    this.projectService.setSelectedProject(event.value);
  }

  toggleMenu() {
    this.onMenuToggle.emit();
  }

}
