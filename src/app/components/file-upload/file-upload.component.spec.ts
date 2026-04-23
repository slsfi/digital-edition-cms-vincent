import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    fixture.componentRef.setInput('collectionId', 1);
    fixture.componentRef.setInput('numberOfPages', 10);
    fixture.componentRef.setInput('missingFileNumbers', []);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
