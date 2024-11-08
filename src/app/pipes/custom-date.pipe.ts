import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDate',
  standalone: true,
})
export class CustomDatePipe implements PipeTransform {

  constructor(private datePipe: DatePipe) {}

  transform(value: string | null, format = 'd.M.yyyy HH:mm'): string {
    if (!value) {
      return '';
    }

    // Full format: 0384-01-01 00:00:00 BC
    const fullBcDateRegex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) BC$/;
    // Short format: 325 BC
    const shortBcDateRegex = /^(\d{1,4}) BC$/;
    let match;

    if (typeof value === 'string' && ((match = value.match(fullBcDateRegex)) || (match = value.match(shortBcDateRegex)))) {
      const year = match[1];
      return `${parseInt(year)} BC`;
    }

    // Fallback to Angular DatePipe for AD dates
    const parsedDate = (typeof value === 'string') ? new Date(value) : value;
    if (parsedDate.toString() === 'Invalid Date') {
      // Try to get only the year from value (e.g. '2021-xx-xx' -> '2021')
      const yearRegex = /^(\d{4})/;
      const yearMatch = value.match(yearRegex);
      if (yearMatch) {
        return yearMatch[1];
      }

      return '';
    }
    return this.datePipe.transform(parsedDate, format) || '';
  }

}
