import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { AddFacsimileToPublicationComponent } from './add-facsimile-to-publication.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';

describe('AddFacsimileToPublicationComponent', () => {
  let component: AddFacsimileToPublicationComponent;
  let fixture: ComponentFixture<AddFacsimileToPublicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFacsimileToPublicationComponent],
      providers: [
        ...getCommonTestingProviders(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {},
              paramMap: convertToParamMap({
                collectionId: '1',
                publicationId: '2'
              }),
              queryParamMap: convertToParamMap({})
            },
            params: of({}),
            queryParams: of({}),
            paramMap: of(convertToParamMap({
              collectionId: '1',
              publicationId: '2'
            })),
            queryParamMap: of(convertToParamMap({}))
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
            getFacsimileCollections: () => of([])
          }
        },
        {
          provide: PublicationService,
          useValue: {
            getPublication: () => of({})
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFacsimileToPublicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
