import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { MainComponent } from './components/main/main.component';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { ProjectService } from './services/project.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, MainComponent, CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule, MatSelectModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'vincent-cms';

  isAuthenticated$: Observable<boolean> = new Observable<boolean>();
  availableProjects$: Observable<any> = new Observable<any>();
  selectedProject$: Observable<any> = new Observable<any>();

  constructor(private authService: AuthService, private projectService: ProjectService) {
    this.isAuthenticated$ = this.authService.$isAuthenticated;
    this.availableProjects$ = this.projectService.getProjects();
    this.selectedProject$ = this.projectService.$selectedProject;
  }

  logout() {
    this.authService.logout();
    this.projectService.setSelectedProject({});
  }

  changeProject(event: any) {
    console.log("changeProject", event.value);
    this.projectService.setSelectedProject(event.value);
  }
}
