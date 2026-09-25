import { ComponentFixture, TestBed } from '@angular/core/testing';
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
});
