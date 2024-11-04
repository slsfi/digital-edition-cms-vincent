import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { navigationItems } from '../../models/common';

@Component({
  selector: 'navigation',
  standalone: true,
  imports: [CommonModule, MatDividerModule, MatListModule, MatIconModule, RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  @Output() onMenuToggle: EventEmitter<void> = new EventEmitter<void>();

  navItems = navigationItems;

  currentUrl: string = '';

  constructor(private projectService: ProjectService, private authService: AuthService, private router: Router) {
    this.router.events.subscribe(() => {
      this.currentUrl = '/' + this.router.url.split('/')[1];
    });
  }

  logout() {
    this.authService.logout();
    this.projectService.setSelectedProject(null);
    localStorage.clear();
  }

  toggleMenu() {
    this.onMenuToggle.emit();
  }

}
