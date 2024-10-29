import { TestBed } from '@angular/core/testing';

import { FacsimileService } from './facsimile.service';

describe('FacsimileService', () => {
  let service: FacsimileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacsimileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
