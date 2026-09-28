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
        provideRouter([
          { path: 'projects', component: TestRouteComponent },
          { path: 'publication-collections/:collectionId', component: TestRouteComponent },
          { path: 'keywords', component: TestRouteComponent },
          { path: 'keywords/linking', component: TestRouteComponent },
          { path: 'logout', component: TestRouteComponent }
        ])
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

    expect(projectsLink?.classList.contains('mdc-list-item--activated')).toBe(true);
  });

  it('keeps a top-level entry active on a nested route', async () => {
    await TestBed.inject(Router).navigateByUrl('/publication-collections/220');
    await fixture.whenStable();

    const textCollectionsLink = Array.from(
      fixture.nativeElement.querySelectorAll('a[mat-list-item]') as NodeListOf<HTMLAnchorElement>
    ).find(link => link.textContent?.includes('Text collections'));

    expect(textCollectionsLink?.classList.contains('mdc-list-item--activated')).toBe(true);
  });

  it('renders the active entry when created after the initial navigation', async () => {
    fixture.destroy();
    await TestBed.inject(Router).navigateByUrl('/publication-collections/220');

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    const textCollectionsLink = Array.from(
      fixture.nativeElement.querySelectorAll('a[mat-list-item]') as NodeListOf<HTMLAnchorElement>
    ).find(link => link.textContent?.includes('Text collections'));

    expect(textCollectionsLink?.classList.contains('mdc-list-item--activated')).toBe(true);
  });

  it('only activates the most specific entry when navigation routes overlap', async () => {
    await TestBed.inject(Router).navigateByUrl('/keywords/linking');
    await fixture.whenStable();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a[mat-list-item]') as NodeListOf<HTMLAnchorElement>
    );
    const keywordsLink = links.find(link => link.textContent?.trim() === 'label Keywords');
    const keywordLinkingLink = links.find(link => link.textContent?.includes('Keyword linking'));

    expect(keywordsLink?.classList.contains('mdc-list-item--activated')).toBe(false);
    expect(keywordLinkingLink?.classList.contains('mdc-list-item--activated')).toBe(true);
  });

  it('closes the menu and navigates to the logout route', async () => {
    const menuToggleSpy = vi.fn();
    component.menuToggle.subscribe(menuToggleSpy);

    const logoutLink = Array.from(
      fixture.nativeElement.querySelectorAll('a[mat-list-item]') as NodeListOf<HTMLAnchorElement>
    ).find(link => link.textContent?.includes('Log out'));
    logoutLink?.click();
    await fixture.whenStable();

    expect(menuToggleSpy).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toBe('/logout');
  });
});
