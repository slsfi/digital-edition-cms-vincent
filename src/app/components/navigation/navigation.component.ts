
import { Component, computed, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { filter, map } from 'rxjs';

import { navigationItems } from '../../models/common.model';

@Component({
  selector: 'navigation',
  imports: [MatDividerModule, MatListModule, MatIconModule, RouterLink],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  private readonly router = inject(Router);

  readonly menuToggle = output<void>();

  protected readonly navItems = navigationItems;

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => this.getPath(event.urlAfterRedirects))
    ),
    { initialValue: this.getPath(this.router.url) }
  );

  protected readonly activeRoute = computed(() => {
    const path = this.currentPath();

    return this.navItems.reduce((mostSpecificRoute, item) => {
      const matches = item.route === '/'
        ? path === '/'
        : path === item.route || path.startsWith(`${item.route}/`);

      return matches && item.route.length > mostSpecificRoute.length ? item.route : mostSpecificRoute;
    }, '');
  });

  protected toggleMenu(): void {
    this.menuToggle.emit();
  }

  private getPath(url: string): string {
    return url.split(/[?#]/)[0];
  }

}
