import type { TimelineProjectionResult, UserProfile } from '../types';

const CACHE_KEY_PREFIX = 'btoptimise_timeline_';
const PROFILE_HASH_KEY_PREFIX = 'btoptimise_timeline_hash_';

function generateProfileHash(profile: Partial<UserProfile>): string {
    const relevantFields = {
        age: profile.age,
        partnerAge: profile.partnerAge,
        applicantType: profile.applicantType,
        employmentStatus: profile.employmentStatus,
        monthlyIncome: profile.monthlyIncome,
        partnerMonthlyIncome: profile.partnerMonthlyIncome,
        cpfOA: profile.cpfOA,
        cashSavings: profile.cashSavings,
        citizenship: profile.citizenship,
        firstTimer: profile.firstTimer,
    };

    const str = JSON.stringify(relevantFields);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

function getCacheKey(sessionId: string): string {
    return `${CACHE_KEY_PREFIX}${sessionId}`;
}

function getHashKey(sessionId: string): string {
    return `${PROFILE_HASH_KEY_PREFIX}${sessionId}`;
}

/* ─── Public API ──────────────────────────────────────────────────── */

export function saveTimelineToCache(
    sessionId: string,
    profile: Partial<UserProfile>,
    timelineData: TimelineProjectionResult
): void {
    try {
        const profileHash = generateProfileHash(profile);
        const cacheKey = getCacheKey(sessionId);
        const hashKey = getHashKey(sessionId);

        localStorage.setItem(cacheKey, JSON.stringify(timelineData));
        localStorage.setItem(hashKey, profileHash);
    } catch (error) {
        console.warn('Failed to save timeline to cache:', error);
    }
}

export function getTimelineFromCache(
    sessionId: string,
    profile: Partial<UserProfile>
): TimelineProjectionResult | null {
    try {
        const currentProfileHash = generateProfileHash(profile);
        const cacheKey = getCacheKey(sessionId);
        const hashKey = getHashKey(sessionId);

        const cachedHash = localStorage.getItem(hashKey);
        const cachedData = localStorage.getItem(cacheKey);

        // Cache miss
        if (!cachedHash || !cachedData) {
            return null;
        }

        if (cachedHash !== currentProfileHash) {
            invalidateTimelineCache(sessionId); // Clean up stale data
            return null;
        }

        // Cache hit - return parsed data
        return JSON.parse(cachedData) as TimelineProjectionResult;
    } catch (error) {
        console.warn('Failed to retrieve timeline from cache:', error);
        return null;
    }
}

export function invalidateTimelineCache(sessionId: string): void {
    try {
        const cacheKey = getCacheKey(sessionId);
        const hashKey = getHashKey(sessionId);

        localStorage.removeItem(cacheKey);
        localStorage.removeItem(hashKey);
    } catch (error) {
        console.warn('Failed to invalidate timeline cache:', error);
    }
}

export function clearAllTimelineCaches(): void {
    try {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(PROFILE_HASH_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.warn('Failed to clear timeline caches:', error);
    }
}

export function hasTimelineCache(sessionId: string): boolean {
    try {
        const cacheKey = getCacheKey(sessionId);
        return localStorage.getItem(cacheKey) !== null;
    } catch {
        return false;
    }
}
