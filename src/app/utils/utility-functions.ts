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
