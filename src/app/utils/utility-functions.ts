/**
 * Removes properties from an object where the value is an empty string
 * (''), null, or undefined. Keeps all other values, including falsy
 * ones like 0, false, empty arrays, and empty objects.
 *
 * Useful for cleaning form data or payloads before sending to an API.
 *
 * @template T - The type of the input object.
 * @param obj - The object to clean.
 * @returns A shallow copy of the object with only meaningful values.
 */
export function cleanObject<T extends object>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== '' && value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}


/**
 * Replaces all empty string ('') values in an object with `null`.
 * This is useful when working with forms or inputs where empty fields
 * default to empty strings, but you want to treat them as nulls for
 * consistency, especially before sending data to an API or storing it.
 *
 * Note: This performs a shallow transformation (does not process nested
 * objects).
 *
 * @template T - The type of the input object.
 * @param obj - The object to clean.
 * @returns A new object with empty string values replaced by `null`.
 */
export function cleanEmptyStrings<T extends object>(obj: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      cleaned[key] = value === '' ? null : value;
    }
  }
  return cleaned as T;
}


/**
 * Compare two arrays of primitive values (e.g., string, number,
 * boolean, null, undefined) for shallow equality. Returns true if
 * both arrays have the same length and each element is strictly equal
 * (`===`) at the same index.
 *
 * This is useful as a comparator for RxJS operators like
 * `distinctUntilChanged`, when working with `combineLatest` tuples of
 * primitive values. For example, it prevents duplicate emissions when
 * all tuple elements are unchanged, even though the arrays are new
 * references.
 *
 * @param a - First array of primitive values
 * @param b - Second array of primitive values
 * @returns true if arrays are the same length and all corresponding elements match strictly
 */
export function shallowArrayEqual<T extends readonly unknown[]>(a: T, b: T): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}


/**
 * Simple conversion of a string date in YYYY-MM-DD format to d.m.YYYY
 * format (or with any other separator). Treats the input date as a string
 * and does not make any checks on it, thus date strings like 1876-03-XX
 * are converted to xx.3.1876.
 * Returns an empty string if the input date can't be converted, and the
 * date as it is if it's only a year in YYYY format.
 */
export function getReadableDate(date: string, separator = '.'): string {
  const fromDate = date.trim().toLowerCase();
  const dateParts = fromDate.split('-');

  if (dateParts.length === 1 && isNDigits(dateParts[0], 4)) {
    // date is only a year
    return dateParts[0];
  } else if (
    dateParts.length === 3 &&
    dateParts[0].length === 4 &&
    dateParts[1].length === 2 &&
    dateParts[2].length === 2
  ) {
    const day = dateParts[2].startsWith('0')
      ? dateParts[2].slice(1)
      : dateParts[2];
    const month = dateParts[1].startsWith('0')
      ? dateParts[1].slice(1)
      : dateParts[1];
    return `${day}${separator}${month}${separator}${dateParts[0]}`;
  } else {
    return '';
  }
}


/**
 * Returns true if the string `str` consists of `n` digits.
 */
export function isNDigits(str: string, n: number): boolean {
  const re = new RegExp(`^\\d{${n}}$`);
  return re.test(str);
}
