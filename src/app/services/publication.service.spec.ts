import { TestBed } from '@angular/core/testing';

import { PublicationService } from './publication.service';

describe('PublicationService', () => {
  let service: PublicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PublicationService,
        { provide: 'ApiService', useValue: { prefixedUrl: 'https://test-api.com/digitaledition' } },
        { provide: 'ProjectService', useValue: { selectedProject$: { value: 'test-project' } } }
      ]
    });
    service = TestBed.inject(PublicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
