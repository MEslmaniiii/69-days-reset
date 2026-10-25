import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js'

export interface Country {
  code: CountryCode // ISO alpha-2
  name: string
  dial: string // "+20"
  flag: string
}

// A curated list leading with common MENA + global countries, then alphabetical.
const RAW: { code: CountryCode; name: string; flag: string }[] = [
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
]

export const COUNTRIES: Country[] = RAW.map((c) => {
  let dial = ''
  try {
    dial = '+' + getCountryCallingCode(c.code)
  } catch {
    dial = ''
  }
  return { ...c, dial }
}).filter((c) => c.dial)

export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.code === 'EG') ?? COUNTRIES[0]

export function countryByCode(code: string | undefined): Country | undefined {
  return COUNTRIES.find((c) => c.code === code)
}

/** Validate a national number against a country. Returns E.164 string or null. */
export function validatePhone(
  nationalNumber: string,
  country: CountryCode
): string | null {
  const parsed = parsePhoneNumberFromString(nationalNumber, country)
  if (parsed && parsed.isValid()) return parsed.number // E.164, e.g. +201234567890
  return null
}
