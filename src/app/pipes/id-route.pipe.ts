import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'idRoute',
  standalone: true
})
export class IdRoutePipe implements PipeTransform {

  transform(value: string[], id: number): string {
    const result = value.concat(id.toString());
    return result.join('/');
  }

}
