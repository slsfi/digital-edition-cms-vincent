import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../services/project.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'topbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @Output() onMenuToggle: EventEmitter<void> = new EventEmitter<void>();

  isAuthenticated$: Observable<boolean> = new Observable<boolean>();
  selectedProject$: Observable<string | null> = new Observable<string | null>();

  constructor(private authService: AuthService, private projectService: ProjectService) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.selectedProject$ = this.projectService.selectedProject$;
  }

  toggleMenu() {
    this.onMenuToggle.emit();
  }

}
