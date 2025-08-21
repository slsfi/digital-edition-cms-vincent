import { TestBed } from '@angular/core/testing';

import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TranslationService,
        { provide: 'ApiService', useValue: { prefixedUrl: 'https://test-api.com/digitaledition' } },
        { provide: 'ProjectService', useValue: { selectedProject$: { value: 'test-project' } } }
      ]
    });
    service = TestBed.inject(TranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
