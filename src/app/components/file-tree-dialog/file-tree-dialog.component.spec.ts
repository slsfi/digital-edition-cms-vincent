import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import { FileTreeDialogComponent } from './file-tree-dialog.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { FileTree } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

describe('FileTreeDialogComponent', () => {
  let component: FileTreeDialogComponent;
  let fixture: ComponentFixture<FileTreeDialogComponent>;
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
      imports: [FileTreeDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: '' },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        {
          provide: ProjectService,
          useValue: {
            getFileTree: () => fileTree$
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileTreeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders delayed tree data and returns a selected node', async () => {
    expect(fixture.nativeElement.querySelector('loading-spinner')).not.toBeNull();

    fileTree$.next({ 'document.xml': null });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('loading-spinner')).toBeNull();
    const fileNode = fixture.nativeElement.querySelector('.selectable') as HTMLElement;
    expect(fileNode.textContent).toContain('document.xml');

    fileNode.click();
    await fixture.whenStable();

    const selectedPath = fixture.nativeElement.querySelector('.selected-text span') as HTMLElement;
    const selectDialogClose = fixture.debugElement
      .queryAll(By.directive(MatDialogClose))
      .map(element => element.injector.get(MatDialogClose))
      .find(dialogClose => Array.isArray(dialogClose.dialogResult));

    expect(selectedPath.textContent).toContain('document.xml');
    expect(selectDialogClose?.dialogResult).toEqual(['document.xml']);
  });
});
