import { TestBed } from '@angular/core/testing';

import { SubjectService } from './subject.service';

describe('SubjectService', () => {
  let service: SubjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubjectService,
        { provide: 'ApiService', useValue: { prefixedUrl: 'https://test-api.com/digitaledition' } },
        { provide: 'ProjectService', useValue: { selectedProject$: { value: 'test-project' } } }
      ]
    });
    service = TestBed.inject(SubjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
