import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FileTreeComponent } from './file-tree.component';
import { ProjectService } from '../../services/project.service';

describe('FileTreeComponent', () => {
  let component: FileTreeComponent;
  let fixture: ComponentFixture<FileTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileTreeComponent],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            getFileTree: () => of({})
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
