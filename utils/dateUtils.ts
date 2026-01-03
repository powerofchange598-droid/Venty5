/**
 * Safely creates a Date object from a given value.
 * @param value The value to convert to a Date (string, number, etc.).
 * @returns A valid Date object or null if the value is invalid.
 */
export const safeDate = (value: string | number | Date | undefined | null): Date | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const d = new Date(value);
  // Check if the date is valid. Invalid dates have a time value of NaN.
  if (isNaN(d.getTime())) {
    console.warn("Invalid date encountered:", value);
    return null;
  }
  return d;
};

/**
 * Safely formats a date string into a localized date string.
 * @param dateValue The date value to format.
 * @param locales Optional locales string.
 * @param options Optional Intl.DateTimeFormatOptions.
 * @param fallback The string to return if the date is invalid.
 * @returns The formatted date string, or a fallback string if the date is invalid.
 */
export const safeFormatDate = (
    dateValue: string | number | Date | undefined | null,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
    fallback: string = "No Date"
): string => {
    const d = safeDate(dateValue);
    if (!d) {
        return fallback;
    }
    return d.toLocaleDateString(locales || 'en-US', options);
};

/**
 * Safely formats a date string into a localized date and time string.
 * @param dateValue The date value to format.
 * @param locales Optional locales string.
 * @param options Optional Intl.DateTimeFormatOptions.
 * @param fallback The string to return if the date is invalid.
 * @returns The formatted date-time string, or a fallback string if the date is invalid.
 */
export const safeFormatDateTime = (
    dateValue: string | number | Date | undefined | null,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
    fallback: string = "No Date"
): string => {
    const d = safeDate(dateValue);
    if (!d) {
        return fallback;
    }
    return d.toLocaleString(locales || 'en-US', options);
};

/**
 * Safely converts a date value into a 'YYYY-MM-DD' string suitable for an <input type="date">.
 * @param dateValue The date value to convert.
 * @returns A 'YYYY-MM-DD' formatted string or an empty string if the date is invalid.
 */
export const toInputDateString = (dateValue: string | number | Date | undefined | null): string => {
    const d = safeDate(dateValue);
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
