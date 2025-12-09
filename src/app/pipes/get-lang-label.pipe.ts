import { Pipe, PipeTransform } from '@angular/core';

import { languageOptions, LanguageCode, LanguageLabel } from '../models/language.model';

/**
 * Pipe that returns the label of a language based on the language code.
 */
@Pipe({
  name: 'getLangLabel'
})
export class GetLangLabelPipe implements PipeTransform {
  transform(code: LanguageCode | string): LanguageLabel | string {
    const lang = languageOptions.find(l => l.code === code);
    return (lang?.label as LanguageLabel ?? code as string);
  }
}
