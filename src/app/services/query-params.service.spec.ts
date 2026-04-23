import { TestBed } from '@angular/core/testing';

import { QueryParamsService } from './query-params.service';
import { getCommonTestingProviders } from '../../testing/test-providers';

describe('QueryParamsService', () => {
  let service: QueryParamsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: getCommonTestingProviders()
    });
    service = TestBed.inject(QueryParamsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
