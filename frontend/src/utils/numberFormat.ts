/**
 * Number formatting utilities for input fields
 */

/**
 * Format a number with comma separators (e.g., 3500 → "3,500")
 */
export function formatNumberWithCommas(value: number | string | undefined): string {
    if (value === undefined || value === null || value === '') return '';

    const numValue = typeof value === 'string' ? value : String(value);

    // Remove all non-digit characters except decimal point
    const cleaned = numValue.replace(/[^\d.]/g, '');

    if (cleaned === '') return '';

    const [integerPart, decimalPart] = cleaned.split('.');
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return decimalPart !== undefined ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * Parse a formatted number string back to a number (removes commas)
 * Returns undefined if the string is empty
 */
export function parseFormattedNumber(value: string): number | undefined {
    if (!value || value.trim() === '') return undefined;

    // Remove commas
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);

    return isNaN(num) ? undefined : num;
}
