import { TestBed } from '@angular/core/testing';

import { FacsimileService } from './facsimile.service';

describe('FacsimileService', () => {
  let service: FacsimileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FacsimileService,
        { provide: 'ApiService', useValue: { prefixedUrl: 'https://test-api.com/digitaledition' } },
        { provide: 'ProjectService', useValue: { selectedProject$: { value: 'test-project' } } }
      ]
    });
    service = TestBed.inject(FacsimileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
