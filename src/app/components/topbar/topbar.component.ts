import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, Observable } from 'rxjs';

import { ApiService } from './../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'topbar',
  imports: [CommonModule, MatToolbarModule, MatTooltipModule,
    MatIconModule, MatButtonModule, MatChipsModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  @Output() menuToggle: EventEmitter<void> = new EventEmitter<void>();

  isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;
  selectedProject$: BehaviorSubject<string | null> = this.projectService.selectedProject$;
  environment$: Observable<string | null> = this.apiService.environment$;

  toggleMenu() {
    this.menuToggle.emit();
  }

  logout() {
    this.projectService.setSelectedProject(null);
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
