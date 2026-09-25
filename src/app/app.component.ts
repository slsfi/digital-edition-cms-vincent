import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Observable } from 'rxjs';

import { NavigationComponent } from './components/navigation/navigation.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, MatSidenavModule, TopbarComponent, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private matIconReg = inject(MatIconRegistry);

  isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;

  ngOnInit() {
    // Set Angular Material to use the new Material Symbols icon font.
    this.matIconReg.setDefaultFontSetClass('material-symbols-outlined');
  }

}
