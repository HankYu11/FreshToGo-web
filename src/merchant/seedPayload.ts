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

/**
 * The shared password for every （示範店）on dev.
 *
 * This is what the existing twelve stores were created with, so it is what actually works
 * today. The seed endpoint reuses a store by email and never resets its password
 * (`DevTestRoutes`), so changing this string does not change those stores — it applies only
 * to a store the seed has to create, e.g. after the dev database is reset.
 *
 * Committed deliberately: throwaway rows on the dev backend, the endpoint that creates them
 * takes no credentials at all, and production has it unmounted.
 */
const SEED_PASSWORD = 'password123'

export const SEED_PAYLOAD: SeedStoreInput[] = SEEDS.map((seed) => ({
  email: `${seed.merchant}@freshtogo.test`,
  password: SEED_PASSWORD,
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
