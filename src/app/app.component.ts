import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { TopbarComponent } from './components/topbar/topbar.component';
import { NavigationComponent } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatSidenavModule, TopbarComponent, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  isAuthenticated$: Observable<boolean> = new Observable<boolean>();

  constructor(
    private authService: AuthService,
    private matIconReg: MatIconRegistry
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit() {
    // Set Angular Material to use the new Material Symbols icon font.
    this.matIconReg.setDefaultFontSetClass('material-symbols-outlined');
  }

}
