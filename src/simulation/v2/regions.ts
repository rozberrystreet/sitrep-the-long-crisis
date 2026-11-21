import type { City, Corridor, Region } from './types.ts'

interface Port {
  corridor: Corridor
  exposure: number
  basePrice: number
}
export const ports: Record<City, Port> = {
  Melbourne: { corridor: 'pacific', exposure: 2, basePrice: 5 },
  Auckland: { corridor: 'pacific', exposure: 3, basePrice: 5 },
  Bristol: { corridor: 'atlantic', exposure: 1, basePrice: 6 },
  Halifax: { corridor: 'atlantic', exposure: 2, basePrice: 4 },
}
export const cityList = Object.keys(ports) as City[]

export function initialMarkets(): Record<City, Region> {
  return Object.fromEntries(
    cityList.map((city) => [
      city,
      { inventory: 20, fuel: 1, price: ports[city].basePrice + 1, jobs: 3 },
    ])
  ) as Record<City, Region>
}
