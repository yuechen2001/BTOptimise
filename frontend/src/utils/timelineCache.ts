/**
 * Timeline Projection Cache Utility
 *
 * Implements hybrid caching strategy using localStorage:
 * - Stores timeline projections keyed by sessionId + profile hash
 * - Invalidates cache when user profile changes
 * - Works alongside React Query cache for optimal performance
 */

import type { TimelineProjectionResult, UserProfile } from '../types';

const CACHE_KEY_PREFIX = 'btoptimise_timeline_';
const PROFILE_HASH_KEY_PREFIX = 'btoptimise_timeline_hash_';

/* ─── Helper Functions ─────────────────────────────────────────────── */

/**
 * Generate a simple hash from a profile object
 * Used to detect if profile has changed since last cache
 */
function generateProfileHash(profile: Partial<UserProfile>): string {
    // Include only fields that affect timeline calculations
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

    // Simple hash: JSON stringify and create hash from length and content sample
    const str = JSON.stringify(relevantFields);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

/**
 * Get cache key for timeline data
 */
function getCacheKey(sessionId: string): string {
    return `${CACHE_KEY_PREFIX}${sessionId}`;
}

/**
 * Get cache key for profile hash
 */
function getHashKey(sessionId: string): string {
    return `${PROFILE_HASH_KEY_PREFIX}${sessionId}`;
}

/* ─── Public API ──────────────────────────────────────────────────── */

/**
 * Save timeline projection to cache with profile fingerprint
 *
 * @param sessionId - User session ID
 * @param profile - Current user profile
 * @param timelineData - Timeline projection result
 */
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
        // Fail silently - cache is nice-to-have, not critical
    }
}

/**
 * Retrieve timeline projection from cache if profile hasn't changed
 *
 * @param sessionId - User session ID
 * @param profile - Current user profile
 * @returns Cached timeline data or null if cache miss/stale
 */
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

        // Profile changed - cache is stale
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

/**
 * Invalidate timeline cache for a session
 * Call this when user updates their profile
 *
 * @param sessionId - User session ID
 */
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

/**
 * Clear all timeline  caches (useful for debugging or logout)
 */
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

/**
 * Check if timeline cache exists for a session
 *
 * @param sessionId - User session ID
 * @returns True if cache exists (may still be stale)
 */
export function hasTimelineCache(sessionId: string): boolean {
    try {
        const cacheKey = getCacheKey(sessionId);
        return localStorage.getItem(cacheKey) !== null;
    } catch {
        return false;
    }
}
