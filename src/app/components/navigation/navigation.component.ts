import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { navigationItems } from '../../models/common';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'navigation',
  imports: [CommonModule, MatDividerModule, MatListModule, MatIconModule, RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnDestroy {
  @Output() menuToggle: EventEmitter<void> = new EventEmitter<void>();

  navItems = navigationItems;

  currentUrl = '';
  private destroy$ = new Subject<void>();

  constructor(private projectService: ProjectService, private authService: AuthService, private router: Router) {
    this.router.events
    .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentUrl = '/' + this.router.url.split('/')[1];
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.authService.logout();
    this.projectService.setSelectedProject(null);
    localStorage.clear();
  }

  toggleMenu() {
    this.menuToggle.emit();
  }

}
