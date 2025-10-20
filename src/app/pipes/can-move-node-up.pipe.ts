import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'canMoveNodeUp'
})
export class CanMoveNodeUpPipe implements PipeTransform {
  transform(nodePath: number[] | undefined | null): boolean {
    if (!nodePath || nodePath.length === 0) return false;
    const index = nodePath[nodePath.length - 1];
    return index > 0;
  }
}
