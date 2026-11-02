import type { ProductCategory } from '../api'

/**
 * Category labels and wrapper colours, mirroring the app
 * (`domain/model/ProductCategory.kt` and `ui/theme/CategoryPalette.kt`) so a pack
 * looks the same here as it does in the standalone app.
 */
const CATEGORY_LABELS: Record<ProductCategory, string> = {
  BAKERY: '烘焙麵包',
  DELI: '便當・熟食',
  PRODUCE: '生鮮蔬果',
  BEVERAGE: '飲料・咖啡',
  DESSERT: '甜點・蛋糕',
  GROCERY: '雜貨零食',
  FROZEN: '冷凍・即食',
  GENERAL: '綜合',
}

const CATEGORY_COLORS: Record<ProductCategory, { bg: string; fg: string }> = {
  BAKERY: { bg: '#F6D9A8', fg: '#7A4E12' },
  DELI: { bg: '#F2C3A4', fg: '#8A3F1C' },
  PRODUCE: { bg: '#CFE0BC', fg: '#3F5A2A' },
  BEVERAGE: { bg: '#E0CDBB', fg: '#5C3A24' },
  DESSERT: { bg: '#F6CBD2', fg: '#8C3348' },
  GROCERY: { bg: '#F7E5A8', fg: '#7A5E10' },
  FROZEN: { bg: '#C8DCE6', fg: '#245468' },
  GENERAL: { bg: '#C2DFDE', fg: '#336563' },
}

export function categoryLabel(category: ProductCategory) {
  return CATEGORY_LABELS[category] ?? CATEGORY_LABELS.GENERAL
}

export function categoryColors(category: ProductCategory) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.GENERAL
}

/**
 * The wash behind a pack's illustration, one per category.
 *
 * Lighter and warmer than the chip colours above: the chip is a label on a white row, this is a
 * whole panel the food sits on, and the app's cards tint that panel rather than leaving it grey.
 */
const CATEGORY_WASH: Record<ProductCategory, string> = {
  BAKERY: '#FBE7C4',
  DELI: '#F7D6C2',
  DESSERT: '#FBDCE2',
  BEVERAGE: '#EFDFCE',
  PRODUCE: '#DDEBCC',
  GROCERY: '#FBEFC4',
  FROZEN: '#DCEAF2',
  GENERAL: '#DCEAE8',
}

export function categoryWash(category: ProductCategory) {
  return CATEGORY_WASH[category] ?? CATEGORY_WASH.GENERAL
}
