import { ApiResponse, Deleted } from "./common";

export interface TranslationResponse extends ApiResponse {
  data: Translation[];
}
export interface Translation {
  field_name: string;
  language: Langugage;
  table_name: string;
  text: string;
  translation_id: number;
  translation_text_id: number;
}

export interface TranslationRequest {
  table_name: string; // name of the table containing the record to be translated
  field_name: string; // name of the field to be translated (if applicable)
  text: string; // the translated text.
  language: Langugage; // the language code for the translation (ISO 639-1).
  translation_id?: number; // the id of an existing translation record in the `translation` table. Required if you intend to add a translation in a new language to an entry that already has one or more translations.
  parent_id?: number; // the id of the record in the table_name table
  parent_translation_field?: string; // the name of the field holding the translation_id (defaults to 'translation_id')
  neutral_text?: string; // the base text before translation
}

export interface TranslationRequestPost {
  table_name: string; // name of the table containing the record to be translated
  field_name?: string; // name of the field to be translated (if applicable)
  language?: Langugage; // the language code for the translation (ISO 639-1).
  translation_text_id?: number; // the id of the record in the `translation_text` table
  deleted?: Deleted;
}

export enum Langugage {
  FINNISH = 'fi',
  SWEDISH = 'sv',
  ENGLISH = 'en',
  ARABIAN = 'ar'
}

export const languageOptions = [
  { label: 'Finnish', value: Langugage.FINNISH },
  { label: 'Swedish', value: Langugage.SWEDISH },
  { label: 'English', value: Langugage.ENGLISH },
  { label: 'Arabian', value: Langugage.ARABIAN }
]

export const nameForLanguage = {
  [Langugage.FINNISH]: 'Finnish',
  [Langugage.SWEDISH]: 'Swedish',
  [Langugage.ENGLISH]: 'English',
  [Langugage.ARABIAN]: 'Arabian'
}
