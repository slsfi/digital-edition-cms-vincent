import { DatePipe } from '@angular/common';
import { CustomDatePipe } from './custom-date.pipe';

describe('CustomDatePipe', () => {
  it('create an instance', () => {
    const datePipe = new DatePipe('en-US');
    const pipe = new CustomDatePipe(datePipe);
    expect(pipe).toBeTruthy();
  });
});
