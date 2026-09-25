import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { NavigationComponent } from './navigation.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

@Component({ template: '' })
class TestRouteComponent {}

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });

    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [
        ...getCommonTestingProviders(),
        provideRouter([{ path: 'projects', component: TestRouteComponent }])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the active entry after a router event', async () => {
    await TestBed.inject(Router).navigateByUrl('/projects?view=list');
    await fixture.whenStable();

    const projectsLink = Array.from(
      fixture.nativeElement.querySelectorAll('a[mat-list-item]') as NodeListOf<HTMLAnchorElement>
    ).find(link => link.textContent?.includes('Projects'));

    expect(component.currentUrl()).toBe('/projects');
    expect(projectsLink?.classList.contains('mdc-list-item--activated')).toBe(true);
  });
});
