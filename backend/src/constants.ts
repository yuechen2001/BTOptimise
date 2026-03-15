export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const APPLICANT_TYPES = ["single", "couple"] as const;
export const EMPLOYMENT_STATUSES = ["employed", "self-employed", "student", "nsf"] as const;
export const CITIZENSHIP_STATUSES = ["SC", "SC/SC", "SC/PR"] as const;
export const FLAT_TYPE_PREFERENCES = ["2-Room Flexi", "3-Room", "4-Room", "5-Room", "3Gen"] as const;
export const REGIONS = [
    "Ang Mo Kio", "Bedok", "Bishan", "Bukit Batok", "Bukit Merah",
    "Bukit Panjang", "Choa Chu Kang", "Clementi", "Geylang", "Hougang",
    "Jurong East", "Jurong West", "Kallang/Whampoa", "Marine Parade",
    "Pasir Ris", "Punggol", "Queenstown", "Sembawang", "Sengkang",
    "Serangoon", "Tampines", "Tengah", "Toa Payoh", "Woodlands", "Yishun"
] as const;

export type ApplicantType = typeof APPLICANT_TYPES[number];
export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];
export type CitizenshipStatus = typeof CITIZENSHIP_STATUSES[number];
export type FlatTypePreference = typeof FLAT_TYPE_PREFERENCES[number];
export type Region = typeof REGIONS[number];
