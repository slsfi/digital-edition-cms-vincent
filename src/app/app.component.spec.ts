import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDrawer } from '@angular/material/sidenav';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { AppComponent } from './app.component';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { ProjectService } from './services/project.service';

@Component({
  template: '<p class="routed-content">Routed content</p>'
})
class RoutedTestComponent {}

describe('AppComponent', () => {
  const isAuthenticated$ = new BehaviorSubject(false);

  beforeEach(async () => {
    isAuthenticated$.next(false);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([{ path: '', component: RoutedTestComponent }]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated$,
            logout: vi.fn()
          }
        },
        {
          provide: ProjectService,
          useValue: {
            selectedProject$: new BehaviorSubject<string | null>(null),
            setSelectedProject: vi.fn()
          }
        },
        {
          provide: ApiService,
          useValue: {
            environment$: new BehaviorSubject<string | null>(null)
          }
        }
      ]
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders routed content and authenticated navigation with the default-OnPush root', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('main.main')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.routed-content')?.textContent).toContain('Routed content');
    expect(fixture.nativeElement.querySelector('navigation')).toBeNull();

    isAuthenticated$.next(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('navigation')).not.toBeNull();
    const menuButton = fixture.nativeElement.querySelector(
      'button[aria-label="Toggle menu"]'
    ) as HTMLButtonElement;
    menuButton.click();
    await fixture.whenStable();

    const drawer = fixture.debugElement.query(By.directive(MatDrawer)).componentInstance as MatDrawer;
    expect(drawer.opened).toBe(true);
  });
});
