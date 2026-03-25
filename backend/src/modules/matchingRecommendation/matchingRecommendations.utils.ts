import { IUserSession } from '../userSession/userSession.model';
import { IFlatType } from '../projectCatalog/project.model';

export const checkIsAffordable = (session: Partial<IUserSession>, flat: IFlatType): boolean => {
    if (!session.maxBudget) {
        return true;
    }
    return !!flat.minIndicativePrice && session.maxBudget >= flat.minIndicativePrice;
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
