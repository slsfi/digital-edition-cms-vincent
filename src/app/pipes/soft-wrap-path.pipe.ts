import { Pipe, PipeTransform } from '@angular/core';

/**
 * SoftWrapPathPipe
 *
 * Inserts HTML <wbr> (word break opportunity) elements into long path / URL
 * strings so that they can wrap nicely in narrow containers (e.g. table cells)
 * without affecting copy–paste.
 *
 * Behavior:
 * - Adds `<wbr>` **after** every slash `/`
 * - Adds `<wbr>` **before** every dot `.` (e.g. before `.html`, `.xml`, etc.)
 *
 * This allows long paths and URLs like:
 *   "documents/trunk/Forelasningar/Forelasningar_1854_ht_1858_vt/1854_ht.xml"
 * to wrap at logical boundaries instead of overflowing or forcing horizontal scroll.
 *
 * Important:
 * - The pipe returns an HTML string containing `<wbr>` tags.
 * - You **must** bind it via `[innerHTML]` so the tags are interpreted as HTML.
 * - `<wbr>` is not copied when the user copies the text, so the clipboard
 *   content remains a clean, unmodified path/URL.
 *
 * Usage in a component template:
 *
 *   <td [innerHTML]="filePath | softWrapPath"></td>
 *
 * Where `filePath` is something like:
 *   "documents/trunk/Forelasningar/Forelasningar_1854_ht_1858_vt/1854_ht.xml"
 */
@Pipe({
  name: 'softWrapPath'
})
export class SoftWrapPathPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    // Insert <wbr> after "/" and before "."
    return value.replace(/[/\.]/g, (match) => {
      if (match === '/') {
        return '/<wbr>';        // break after slash
      } else {
        return '<wbr>.';        // break before dot
      }
    });
  }
}
