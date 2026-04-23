import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { FacsimileCollectionComponent } from './facsimile-collection.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';

describe('FacsimileCollectionComponent', () => {
  let component: FacsimileCollectionComponent;
  let fixture: ComponentFixture<FacsimileCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacsimileCollectionComponent],
      providers: [
        ...getCommonTestingProviders(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: '1' },
              paramMap: convertToParamMap({ id: '1' })
            }
          }
        },
        {
          provide: ProjectService,
          useValue: {
            getCurrentProject: () => 'test-project'
          }
        },
        {
          provide: FacsimileService,
          useValue: {
            getFacsimileCollection: () => of({ number_of_pages: 0 }),
            verifyFacsimileFile: () => of({ data: { missing_file_numbers: [] } })
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
