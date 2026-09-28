import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LogoutComponent } from './logout.component';

@Component({ template: '' })
class TestRouteComponent {}

describe('LogoutComponent', () => {
  let fixture: ComponentFixture<LogoutComponent>;
  const authService = { logout: vi.fn() };

  beforeEach(async () => {
    authService.logout.mockClear();

    await TestBed.configureTestingModule({
      imports: [LogoutComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([{ path: 'login', component: TestRouteComponent }])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoutComponent);
  });

  it('logs out and replaces the current route with login', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authService.logout).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
