import { api } from './client'
import { toBox, type Box } from './boxes'
import type { components } from '../types/api-schema'

type ReservationResponse = components['schemas']['ReservationResponse']
type ReservationCreatedResponse = components['schemas']['ReservationCreatedResponse']

/** ACTIVE | PICKED_UP | CANCELLED | NO_SHOW | EXPIRED */
export type ReservationStatus = components['schemas']['ReservationStatus']

interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface CreatedReservation {
  id: string
  orderId: string
  redemptionCode: string
  price: number
  merchantTimezone: string
  pickupWindowStartUtc: string | null
  pickupWindowEndUtc: string | null
}

export interface Reservation extends CreatedReservation {
  box: Box | null
  isPickedUp: boolean
  isCancelled: boolean
  status: ReservationStatus
  /** Who cancelled, when cancelled. */
  cancelledBy: NonNullable<ReservationResponse['cancelledBy']> | null
  /** Only ever set when the merchant cancelled. */
  cancellationReason: string | null
}

/** Reserve a pack. Needs a user session. 400 when sold out, outside the sale window, or blocked. */
export async function createReservation(boxId: string): Promise<CreatedReservation> {
  const res = await api.post<ApiResponse<ReservationCreatedResponse>>(
    '/api/reservations',
    { boxId },
    { auth: true },
  )
  const data = res.data ?? {}
  return {
    id: data.id ?? '',
    orderId: data.orderId ?? '',
    redemptionCode: data.redemptionCode ?? '',
    price: data.price ?? 0,
    merchantTimezone: data.merchantTimezone || 'Asia/Taipei',
    pickupWindowStartUtc: data.pickupWindowStartUtc ?? null,
    pickupWindowEndUtc: data.pickupWindowEndUtc ?? null,
  }
}

/**
 * One reservation, with its box nested — so the ticket survives a reload without
 * carrying the store's address through router state.
 */
export async function getReservation(id: string, signal?: AbortSignal): Promise<Reservation> {
  const res = await api.get<ApiResponse<ReservationResponse>>(
    `/api/reservations/${encodeURIComponent(id)}`,
    { auth: true, signal },
  )
  const data = res.data ?? {}
  return {
    id: data.id ?? id,
    orderId: data.orderId ?? '',
    redemptionCode: data.redemptionCode ?? '',
    price: data.box?.discountedPrice ?? 0,
    merchantTimezone: data.box?.merchantTimezone || 'Asia/Taipei',
    pickupWindowStartUtc: data.pickupWindowStartUtc ?? null,
    pickupWindowEndUtc: data.pickupWindowEndUtc ?? null,
    box: data.box ? toBox(data.box) : null,
    isPickedUp: data.isPickedUp ?? false,
    isCancelled: data.isCancelled ?? false,
    status: data.status ?? 'ACTIVE',
    cancelledBy: data.cancelledBy ?? null,
    cancellationReason: data.cancellationReason ?? null,
  }
}
