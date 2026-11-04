import type { SeedStoreInput } from '../api/devSeed'
import { SEEDS } from '../webview/demoCatalog'

/**
 * The stand-in catalogue, as something the dev backend can be asked to create.
 *
 * One source of truth: these are the same twelve packs the webview falls back to when the
 * backend has nothing listed. Seeding them turns the fallback off, because the flow prefers
 * real listings whenever they exist — so what the demo shows afterwards is genuinely the
 * backend's, not a fixture wearing its clothes.
 */
export const SEED_PAYLOAD: SeedStoreInput[] = SEEDS.map((seed) => ({
  email: `${seed.merchant}@freshtogo.test`,
  storeName: seed.store,
  storeAddress: seed.address,
  storeLatitude: seed.latitude,
  storeLongitude: seed.longitude,
  listings: [
    {
      name: seed.name,
      description: seed.description,
      category: seed.category,
      originalPrice: seed.originalPrice,
      discountedPrice: seed.discountedPrice,
      quantity: seed.quantity,
      pickupTimeStart: seed.pickup[0],
      pickupTimeEnd: seed.pickup[1],
    },
  ],
}))
