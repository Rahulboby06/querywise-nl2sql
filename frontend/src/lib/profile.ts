export type Profile = { fullName: string; department: string; designation: string; institution: string }
const key = 'nl2sql-local-profile'
export const defaultProfile: Profile = { fullName: 'Rahul Anand', department: '', designation: '', institution: '' }
export function loadProfile(): Profile {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || 'null')
    if (value && typeof value === 'object') {
      const data = value as Partial<Profile>
      return {
        fullName: typeof data.fullName === 'string' && data.fullName.trim() ? data.fullName : defaultProfile.fullName,
        department: typeof data.department === 'string' ? data.department : '',
        designation: typeof data.designation === 'string' ? data.designation : '',
        institution: typeof data.institution === 'string' ? data.institution : '',
      }
    }
  } catch { /* Storage can be unavailable or contain invalid data. */ }
  return defaultProfile
}
export function saveProfile(profile: Profile): void { localStorage.setItem(key, JSON.stringify(profile)) }
export function profileInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]?.toLocaleUpperCase() ?? '').join('') || '?'
}
