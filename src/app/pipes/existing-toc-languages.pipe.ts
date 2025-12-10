import { Pipe, PipeTransform } from '@angular/core';

import { GenericLanguageObj, LanguageObjWithNone } from '../models/language.model';
import { TocLanguageVariants, UNIVERSAL_TOC_LANGUAGE } from '../models/table-of-contents.model';


@Pipe({
  name: 'existingTocLanguages'
})
export class ExistingTocLanguagesPipe implements PipeTransform {
  transform(
    allLanguages: readonly LanguageObjWithNone[],
    variants: TocLanguageVariants
  ): GenericLanguageObj[] {
    const result: GenericLanguageObj[] = [];

    // Shared first, if it exists
    if (variants.hasUniversal) {
      result.push(UNIVERSAL_TOC_LANGUAGE);
    }

    // Then all language-specific TOCs, in declared order
    for (const lang of allLanguages) {
      if (lang.code !== null && variants.languages.includes(lang.code)) {
        result.push({
          label: lang.label,
          code: lang.code
        });
      }
    }

    return result;
  }
}
