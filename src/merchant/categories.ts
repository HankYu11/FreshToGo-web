import type { ProductCategory } from '../api'

/**
 * The eight categories the backend accepts, with the labels the app shows
 * (`ProductCategory.kt`). The wire value is the ASCII code; the Chinese is a client concern.
 */
export const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'GENERAL', label: '綜合' },
  { value: 'BAKERY', label: '烘焙麵包' },
  { value: 'DELI', label: '便當・熟食' },
  { value: 'PRODUCE', label: '生鮮蔬果' },
  { value: 'BEVERAGE', label: '飲料・咖啡' },
  { value: 'DESSERT', label: '甜點・蛋糕' },
  { value: 'GROCERY', label: '雜貨零食' },
  { value: 'FROZEN', label: '冷凍・即食' },
]
