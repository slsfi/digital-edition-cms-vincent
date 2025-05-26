import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ApiService } from './../../services/api.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'topbar',
  imports: [CommonModule, MatToolbarModule, MatTooltipModule,
    MatIconModule, MatButtonModule, MatChipsModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @Output() menuToggle: EventEmitter<void> = new EventEmitter<void>();

  isAuthenticated$: Observable<boolean> = new Observable<boolean>();
  selectedProject$;
  environment$: Observable<string | null> = new Observable<string | null>();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router,
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.selectedProject$ = this.projectService.selectedProject$;
    this.environment$ = this.apiService.environment$;
  }

  toggleMenu() {
    this.menuToggle.emit();
  }

  logout() {
    this.projectService.setSelectedProject(null);
    this.authService.logout();    
    localStorage.clear();
    this.router.navigate(['/login']);
  }

}
