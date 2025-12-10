import { Pipe, PipeTransform } from '@angular/core';

import { LanguageObjWithNone } from '../models/language.model';
import { TocLanguageVariants } from '../models/table-of-contents.model';


@Pipe({
  name: 'nonExistingTocLanguages'
})
export class NonExistingTocLanguagesPipe implements PipeTransform {
  transform(
    allLanguages: readonly LanguageObjWithNone[],
    variants: TocLanguageVariants
  ): LanguageObjWithNone[] {
    return allLanguages.filter(
      opt => opt.code !== null && !variants.languages.includes(opt.code)
    );
  }
}
