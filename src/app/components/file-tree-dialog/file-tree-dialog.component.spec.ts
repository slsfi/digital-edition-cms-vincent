import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTreeDialogComponent } from './file-tree-dialog.component';

describe('FileTreeDialogComponent', () => {
  let component: FileTreeDialogComponent;
  let fixture: ComponentFixture<FileTreeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTreeDialogComponent]
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
