import { cities, households, reserves, roles } from './simulation/engine.ts'
import type { Profile } from './simulation/engine.ts'
const member = (object: object, key: unknown) =>
  typeof key === 'string' && Object.hasOwn(object, key)
export const validText = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max
export function validProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Partial<Profile>
  return (
    validText(p.name, 40) &&
    member(cities, p.city) &&
    member(reserves, p.reserve) &&
    roles.some((role) => role === p.role) &&
    households.some((household) => household === p.household)
  )
}
