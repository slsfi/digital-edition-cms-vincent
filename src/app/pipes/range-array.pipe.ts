import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe that generates an array of sequential numbers starting
 * from 1 up to the given value.
 *
 * Usage in template:
 *   {{ value | rangeArray }}
 * Example:
 *   Input: 5
 *   Output: [1, 2, 3, 4, 5]
 */

@Pipe({
  name: 'rangeArray'
})
export class RangeArrayPipe implements PipeTransform {

  transform(value: number): number[] {
    return Array.from({ length: value }, (_, i) => i + 1);
  }

}
