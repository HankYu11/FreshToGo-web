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
 * The password every store seeded from here is created with.
 *
 * Without one the backend gives a new store `randomPassword()` and never returns it
 * (`DevTestRoutes`), so nobody can sign in as that store and its pack can be reserved but
 * never redeemed. The `@demo.freshtogo.test` scheme below exists for the same reason: the
 * endpoint reuses a store by email and never resets its password, so the stores seeded
 * before this password was added stay unreachable, and a fresh address is the only way past
 * them.
 *
 * Deliberately the same value as the older `demo-<station>-<type>@freshtogo.test` stores that
 * the retired `scripts/seed-demo.sh` created, so dev has one store password and not two.
 *
 * Committed deliberately: throwaway rows on the dev backend, the endpoint that creates them
 * takes no credentials at all, and production has it unmounted.
 */
const SEED_PASSWORD = 'password123'

export const SEED_PAYLOAD: SeedStoreInput[] = SEEDS.map((seed) => ({
  email: `${seed.merchant}@demo.freshtogo.test`,
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
