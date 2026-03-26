import { IUserSession } from '../userSession/userSession.model';
import { IFlatType } from '../projectCatalog/project.model';
import { AffordabilityStatus } from '../../constants';

export const getAffordabilityDetails = (
    session: Partial<IUserSession>,
    flat: IFlatType,
    financials: any
) => {
    const price = flat.minIndicativePrice ?? 0;

    if (session.maxBudget && price > session.maxBudget) {
        return { status: AffordabilityStatus.OUT_OF_REACH, colour: 'red' };
    }

    // legal / financial limits (MSR > 30% or cash shortfall)
    const msr = financials.loan.msrUsed || 0;
    const hasCashShortfall = financials.affordability.cashShortfall > 0;

    if (msr > 0.3 || hasCashShortfall) {
        return { status: AffordabilityStatus.OUT_OF_REACH, colour: 'red' };
    }

    // MSR is high OR they are using more than 80% of their total cash savings
    const cashRequired = financials.cashFlow.totalCashRequired || 0;
    const cashSavings = session.cashSavings || 1;
    const isHighCashUsage = cashRequired / cashSavings > 0.8;

    if (msr > 0.25 || isHighCashUsage) {
        return { status: AffordabilityStatus.STRETCH_REQUIRED, colour: 'yellow' };
    }

    return { status: AffordabilityStatus.CAN_AFFORD, colour: 'green' };
};

export const getDemandColour = (rate: number): string => {
    if (rate <= 1.0) return 'green';
    if (rate <= 3.0) return 'yellow';
    return 'red';
};

export const isFlatTypePreferred = (session: IUserSession, flat: IFlatType): boolean => {
    if (!session.preferredFlatTypes?.length) return true;
    return session.preferredFlatTypes.map((t) => t.toLowerCase()).includes(flat.type.toLowerCase());
};
