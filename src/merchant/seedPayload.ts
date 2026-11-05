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
 * (`DevTestRoutes`), so nobody can sign in as that store afterwards — and a store nobody can
 * sign into is a demo where the pack can be reserved but never collected, because both
 * redemption routes require a merchant session. The first set was seeded without a password
 * and is stranded for good: the endpoint reuses an existing store by email and never touches
 * its password, so there is nothing to repair, only a new set to start.
 *
 * Committed deliberately. These are throwaway （示範店）rows on the dev backend, and the
 * endpoint that creates them takes no credentials at all — anyone who can reach dev can
 * already stand up stores and listings there, so a password for twelve of them gives nothing
 * further away. It is deliberately not a password used anywhere else, and production has this
 * endpoint unmounted.
 */
const SEED_PASSWORD = 'demo-store-2026'

export const SEED_PAYLOAD: SeedStoreInput[] = SEEDS.map((seed) => ({
  // `@demo.freshtogo.test`, not the bare `@freshtogo.test` the stranded set used: a fresh
  // address is the only way to get a store whose password is known.
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
