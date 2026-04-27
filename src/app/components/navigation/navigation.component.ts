
import { Component, EventEmitter, OnDestroy, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Subject, takeUntil } from 'rxjs';

import { navigationItems } from '../../models/common.model';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'navigation',
  imports: [MatDividerModule, MatListModule, MatIconModule, RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnDestroy {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @Output() menuToggle: EventEmitter<void> = new EventEmitter<void>();

  navItems = navigationItems;

  currentUrl = '';
  private destroy$ = new Subject<void>();

  constructor() {
    this.router.events.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentUrl = this.router.url.split('?')[0]; // Remove query parameters
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.authService.logout();
    this.projectService.setSelectedProject(null);
  }

  toggleMenu() {
    this.menuToggle.emit();
  }

}
