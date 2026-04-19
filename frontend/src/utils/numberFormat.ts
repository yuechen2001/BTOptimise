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

export function parseFormattedNumber(value: string): number | undefined {
    if (!value || value.trim() === '') return undefined;

    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);

    return isNaN(num) ? undefined : num;
}
