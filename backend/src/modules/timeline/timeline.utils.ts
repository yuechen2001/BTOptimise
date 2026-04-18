import { IncomeGrowthScenario } from './timeline.types';
import { MAX_TIMELINE_YEARS } from '../../constants';

export function validatePositiveNumber(value: unknown, fieldName: string): string | null {
    if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return `${fieldName} must be a non-negative number`;
    }
    return null;
}

export function validateYear(value: unknown, fieldName: string): string | null {
    if (typeof value !== 'number' || isNaN(value) || value < 2020 || value > 2040) {
        return `${fieldName} must be a valid year between 2020 and 2040`;
    }
    return null;
}

export function validateIncomeGrowthScenario(value: unknown): string | null {
    const validScenarios: IncomeGrowthScenario[] = ['conservative', 'moderate', 'aggressive'];
    if (typeof value !== 'string' || !validScenarios.includes(value as IncomeGrowthScenario)) {
        return 'incomeGrowthScenario must be one of: conservative, moderate, aggressive';
    }
    return null;
}

export function validateTimelineConfig(config: any): string | null {
    if (!config) {
        return 'Configuration object is required';
    }

    const startYearError = validateYear(config.startYear, 'startYear');
    if (startYearError) return startYearError;

    const endYearError = validateYear(config.endYear, 'endYear');
    if (endYearError) return endYearError;

    if (config.endYear <= config.startYear) {
        return 'endYear must be greater than startYear';
    }

    if (config.endYear - config.startYear > MAX_TIMELINE_YEARS) {
        return `Timeline cannot exceed ${MAX_TIMELINE_YEARS} years`;
    }

    const intervalError = validatePositiveNumber(config.intervalMonths, 'intervalMonths');
    if (intervalError) return intervalError;

    if (![3, 6, 12].includes(config.intervalMonths)) {
        return 'intervalMonths must be 3, 6, or 12';
    }

    const scenarioError = validateIncomeGrowthScenario(config.incomeGrowthScenario);
    if (scenarioError) return scenarioError;

    // Optional fields validation
    if (config.currentMonthlyRent !== undefined) {
        const rentError = validatePositiveNumber(config.currentMonthlyRent, 'currentMonthlyRent');
        if (rentError) return rentError;
    }

    if (config.assumedStartingSalary !== undefined) {
        const salaryError = validatePositiveNumber(
            config.assumedStartingSalary,
            'assumedStartingSalary'
        );
        if (salaryError) return salaryError;
    }

    if (config.assumeEmploymentDate !== undefined) {
        const date = new Date(config.assumeEmploymentDate);
        if (isNaN(date.getTime())) {
            return 'assumeEmploymentDate must be a valid ISO date string';
        }
    }

    return null;
}
