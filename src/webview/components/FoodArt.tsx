import type { ProductCategory } from '../../api'

/**
 * Flat food illustrations, one per category, drawn to match the app's listing cards
 * (`MysteryBoxCard` renders the same artwork from the stock-photo library).
 *
 * Inline SVG rather than image files: a listing seeded on dev usually resolves to a stock photo,
 * but a demo cannot depend on that, and a pack card with an empty grey box is the one thing that
 * makes surplus food look unappetising. These also cost no extra request in the webview.
 *
 * Everything sits in a 160×90 box so the art fills the card's 16:9 media area.
 */
export default function FoodArt({ category }: { category: ProductCategory }) {
  return (
    <svg
      className="ew-foodart"
      viewBox="0 0 160 90"
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {ART[category] ?? ART.GENERAL}
    </svg>
  )
}

const bakery = (
  <g>
    {/* baguette */}
    <g transform="rotate(-22 40 54)">
      <rect x="16" y="46" width="48" height="17" rx="8.5" fill="#E09A41" />
      <path d="M27 51l5 6M36 50l5 6M45 50l5 6M54 51l5 6" stroke="#FBE2B4" strokeWidth="2.8" strokeLinecap="round" />
    </g>
    {/* croissant: a crescent arch with its segments, not a spiral */}
    <g transform="translate(58 10)">
      <path
        d="M6 52C6 24 22 8 42 8s32 14 32 34"
        fill="none"
        stroke="#EDB346"
        strokeWidth="19"
        strokeLinecap="round"
      />
      <path
        d="M14 42c6 2 10 0 12-4M28 22c5 4 10 4 15 1M46 16c3 5 8 7 13 6M64 34c-4 3-6 8-5 12"
        fill="none"
        stroke="#D08F2C"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity=".55"
      />
      <path d="M22 26c5-6 12-10 20-10" stroke="#FBE2B4" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity=".75" />
    </g>
    {/* loaf, cut face forward */}
    <g transform="translate(112 36)">
      <path d="M2 16C2 7 9 0 19 0h10c10 0 17 7 17 16v18a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill="#E09A41" />
      <path d="M9 18c0-6 4-10 10-10h8c6 0 10 4 10 10v16H9z" fill="#FFF3DA" />
    </g>
  </g>
)

const deli = (
  <g>
    {/* bento box */}
    <g transform="rotate(-6 46 48)">
      <rect x="14" y="30" width="66" height="36" rx="5" fill="#4C4A50" />
      <rect x="18" y="34" width="26" height="28" rx="3" fill="#FFF8EC" />
      <circle cx="31" cy="48" r="5" fill="#E8604C" />
      <rect x="47" y="34" width="14" height="13" rx="2" fill="#7FA653" />
      <rect x="47" y="49" width="14" height="13" rx="2" fill="#E8A54B" />
      <rect x="64" y="34" width="12" height="28" rx="2" fill="#C96A3F" />
    </g>
    {/* drumstick */}
    <g transform="rotate(16 112 44)">
      <path d="M104 18c10-6 22 0 24 11 2 10-4 17-4 24 0 6-5 10-11 10s-11-4-11-10c0-8-7-13-7-22 0-7 4-11 9-13z" fill="#B4593A" />
      <path d="M106 60c-4 3-9 2-11-1s-1-7 3-9" fill="#FFF3DA" stroke="#FFF3DA" strokeWidth="5" strokeLinejoin="round" />
      <path d="M110 30c2-5 7-7 11-6" stroke="#CE7555" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
    {/* greens */}
    <path d="M128 54c8-10 22-8 26 2 3 8-4 14-12 14-9 0-18-6-14-16z" fill="#7FA653" />
    <path d="M136 66c2-7 6-11 11-12" stroke="#A8C67E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
  </g>
)

const dessert = (
  <g>
    {/* cake slice */}
    <g transform="translate(16 22)">
      <path d="M4 44L34 8l30 36z" fill="#FBE2B4" />
      <path d="M4 44L34 8l30 36z" fill="none" stroke="#F0CE94" strokeWidth="2" />
      <path d="M12 34l22-26 22 26z" fill="#E8899B" />
      <path d="M19 26l15-18 15 18z" fill="#FFF3DA" />
      <circle cx="34" cy="10" r="5" fill="#E8604C" />
    </g>
    {/* donut */}
    <g transform="translate(92 26)">
      <circle cx="26" cy="26" r="26" fill="#E8A54B" />
      <path d="M26 2a24 24 0 0 1 0 48 24 24 0 0 1 0-48z" fill="#C96A3F" opacity=".25" />
      <circle cx="26" cy="26" r="24" fill="#E8899B" />
      <circle cx="26" cy="26" r="9" fill="#FFF8EC" />
      <path d="M14 18l5 3M34 12l2 5M40 30l5-2M20 38l3 5M34 40l4 3" stroke="#FFF8EC" strokeWidth="3" strokeLinecap="round" />
    </g>
  </g>
)

const beverage = (
  <g>
    {/* cup */}
    <g transform="translate(22 16)">
      <path d="M8 16h46l-5 42a8 8 0 0 1-8 7H21a8 8 0 0 1-8-7z" fill="#FFF8EC" />
      <path d="M10 16h42l-2 16H12z" fill="#8C5A36" />
      <rect x="4" y="8" width="54" height="10" rx="5" fill="#C96A3F" />
      <path d="M54 26c9-3 15 2 14 9-1 6-7 9-13 7" fill="none" stroke="#FFF8EC" strokeWidth="6" strokeLinecap="round" />
    </g>
    {/* pastry */}
    <g transform="translate(96 40)">
      <circle cx="26" cy="22" r="22" fill="#E8A54B" />
      <circle cx="26" cy="22" r="13" fill="#FBE2B4" />
      <circle cx="26" cy="22" r="6" fill="#E8604C" />
    </g>
    {/* steam */}
    <path d="M44 10c3-4 0-7 2-10M58 10c3-4 0-7 2-10" stroke="#D9CBB6" strokeWidth="3" strokeLinecap="round" fill="none" />
  </g>
)

const produce = (
  <g>
    <g transform="rotate(-12 44 48)">
      <ellipse cx="44" cy="50" rx="26" ry="22" fill="#7FA653" />
      <path d="M26 46c8-8 24-10 34-4" stroke="#A8C67E" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M44 28c0-8 5-13 12-14-1 8-5 13-12 14z" fill="#5E8440" />
    </g>
    <g transform="translate(84 24)">
      <circle cx="24" cy="36" r="22" fill="#E8604C" />
      <path d="M24 14c0-6 4-10 10-11-1 6-4 10-10 11z" fill="#5E8440" />
      <path d="M12 30c3-6 8-9 14-9" stroke="#F3927F" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
    <g transform="translate(118 44)">
      <path d="M6 20c0-10 7-18 16-18s16 8 16 18-7 22-16 22S6 30 6 20z" fill="#E8A54B" />
      <path d="M22 2V-6" stroke="#5E8440" strokeWidth="4" strokeLinecap="round" />
    </g>
  </g>
)

const grocery = (
  <g>
    <g transform="rotate(-8 48 46)">
      <path d="M22 26h52l-5 40a6 6 0 0 1-6 5H33a6 6 0 0 1-6-5z" fill="#E8A54B" />
      <path d="M22 26h52l-2 12H24z" fill="#C98B35" />
      <path d="M38 44h20M38 54h14" stroke="#FFF3DA" strokeWidth="4" strokeLinecap="round" />
    </g>
    <g transform="translate(92 30)">
      <rect x="4" y="10" width="42" height="42" rx="6" fill="#E8899B" />
      <rect x="12" y="18" width="26" height="26" rx="4" fill="#FFF8EC" />
      <path d="M20 31h10M25 26v10" stroke="#E8604C" strokeWidth="3.4" strokeLinecap="round" />
    </g>
  </g>
)

const frozen = (
  <g>
    <g transform="translate(20 20)">
      <rect x="4" y="10" width="54" height="44" rx="6" fill="#9CC2D4" />
      <rect x="12" y="18" width="38" height="28" rx="4" fill="#E6F1F6" />
      <path d="M31 22v20M22 32h18M24 25l14 14M38 25L24 39" stroke="#6FA0B8" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g transform="translate(92 26)">
      <path d="M8 18h44l-4 34a7 7 0 0 1-7 6H19a7 7 0 0 1-7-6z" fill="#FFF8EC" />
      <path d="M12 26h36l-2 14H14z" fill="#E8A54B" />
      <rect x="4" y="10" width="52" height="10" rx="5" fill="#9CC2D4" />
    </g>
  </g>
)

const general = (
  <g>
    {/* a bowl, the brand's own mark, filled */}
    <g transform="translate(26 18)">
      <path d="M4 30h74c0 20-17 32-37 32S4 50 4 30z" fill="#4B8F8C" />
      <path d="M12 36h58c-2 13-13 20-29 20s-27-7-29-20z" fill="#6AA6A3" />
      <circle cx="58" cy="16" r="11" fill="#EDB346" />
      <path d="M26 26c0-8 6-14 14-14" stroke="#9BCBC9" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
    <g transform="translate(112 44)">
      <path d="M6 18c0-9 7-16 15-16s15 7 15 16-7 20-15 20S6 27 6 18z" fill="#E8A54B" />
      <path d="M21 2V-5" stroke="#7FA653" strokeWidth="4" strokeLinecap="round" />
    </g>
  </g>
)

const ART: Record<ProductCategory, React.ReactElement> = {
  BAKERY: bakery,
  DELI: deli,
  DESSERT: dessert,
  BEVERAGE: beverage,
  PRODUCE: produce,
  GROCERY: grocery,
  FROZEN: frozen,
  GENERAL: general,
}
