import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { CustomDatePipe } from './custom-date.pipe';

describe('CustomDatePipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatePipe]
    });
  });

  it('create an instance', () => {
    const pipe = TestBed.runInInjectionContext(() => new CustomDatePipe());

    expect(pipe).toBeTruthy();
  });
});
