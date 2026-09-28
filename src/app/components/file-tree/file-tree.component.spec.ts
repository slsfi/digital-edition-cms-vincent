import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTree } from '@angular/material/tree';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import { FileTreeComponent } from './file-tree.component';
import { FileTree } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

describe('FileTreeComponent', () => {
  let component: FileTreeComponent;
  let fixture: ComponentFixture<FileTreeComponent>;
  let fileTree$: Subject<FileTree | null>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    fileTree$ = new Subject<FileTree | null>();

    await TestBed.configureTestingModule({
      imports: [FileTreeComponent],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            getFileTree: () => fileTree$
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders tree data and removes the loading state after a service emission', async () => {
    expect(fixture.nativeElement.querySelector('loading-spinner')).not.toBeNull();

    fileTree$.next({ 'document.xml': null });
    await fixture.whenStable();

    expect(component.dataSource().map(node => node.name)).toEqual(['document.xml']);
    expect(component.loading()).toBe(false);
    expect(fixture.nativeElement.querySelector('loading-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.selectable')?.textContent).toContain('document.xml');
  });

  it('stops loading and renders an empty state when the file tree is empty', async () => {
    fileTree$.next({});
    await fixture.whenStable();

    expect(component.dataSource()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(fixture.nativeElement.querySelector('loading-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain('No files found.');
  });

  it('keeps expanded folders open after selecting a file', async () => {
    fileTree$.next({ folder: { 'document.xml': null } });
    await fixture.whenStable();

    const folder = component.dataSource()[0];
    const file = folder.children[0];
    const tree = fixture.debugElement.query(By.directive(MatTree)).componentInstance as MatTree<typeof folder>;
    tree.expand(folder);

    component.select(file);

    expect(tree.isExpanded(folder)).toBe(true);
    expect(component.selectedNodes).toEqual(['folder', 'document.xml']);
  });

  it('shows the close button when configured and emits panelClosed', async () => {
    const panelClosed = vi.fn();
    component.panelClosed.subscribe(panelClosed);
    fixture.componentRef.setInput('showCloseButton', true);
    await fixture.whenStable();

    const closeButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    closeButton.click();

    expect(panelClosed).toHaveBeenCalledOnce();
  });

  it('stops reacting to file-tree updates after destruction', () => {
    fixture.destroy();

    fileTree$.next({ 'document.xml': null });

    expect(component.dataSource()).toEqual([]);
  });
});
