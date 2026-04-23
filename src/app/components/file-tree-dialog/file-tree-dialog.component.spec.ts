import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

import { FileTreeDialogComponent } from './file-tree-dialog.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { ProjectService } from '../../services/project.service';

describe('FileTreeDialogComponent', () => {
  let component: FileTreeDialogComponent;
  let fixture: ComponentFixture<FileTreeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTreeDialogComponent],
      providers: [
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: 'folder/file.xml' },
        {
          provide: ProjectService,
          useValue: {
            getFileTree: () => of({})
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileTreeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
