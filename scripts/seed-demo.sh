#!/usr/bin/env bash
# Seed the /easywallet demo's data on the DEV backend.
#
# The demo shows packs within walking distance of 龍山寺 / 西門 / 台北車站, and a pack only
# exists for one day — `GET /api/boxes` returns today's listings, and `saleDate` cannot be in
# the past. So the stores are created once and the packs have to be re-created on the morning
# of each demo. Run this, then open https://dev.handyla.co/easywallet.
#
#   scripts/seed-demo.sh              # create today's packs (and any missing stores)
#   scripts/seed-demo.sh --stores     # stores only, no packs
#   scripts/seed-demo.sh --check      # report what exists today, change nothing
#
# Idempotent: a store that already exists is reused, and a pack whose name already exists for
# today is left alone. Safe to run twice.
#
# CREDENTIALS come from scripts/.demo-seed.env (gitignored), from a file named by
# DEMO_SEED_ENV, or from the environment:
#
#   ADMIN_EMAIL=...        # an admin on dev-admin.handyla.co — creates the stores
#   ADMIN_PASSWORD=...
#   MERCHANT_PASSWORD=...  # the password given to every demo store this script creates
#
# It only ever creates stores and today's packs. It does not touch any consumer account.
#
# It refuses to run against anything but the dev API. Never point BASE_URL at production.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# DEMO_SEED_ENV points at an env file somewhere else — the Maestro suite's, say — so the same
# credentials do not have to be copied to a second place to run this.
ENV_FILE="${DEMO_SEED_ENV:-$SCRIPT_DIR/.demo-seed.env}"
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }

BASE_URL="${BASE_URL:-https://dev-api.handyla.co}"
case "$BASE_URL" in
  *dev-api.handyla.co*|*localhost*|*127.0.0.1*) ;;
  *) echo "REFUSING: BASE_URL '$BASE_URL' is not the dev API." >&2; exit 2 ;;
esac

for bin in curl jq; do
  command -v "$bin" >/dev/null || { echo "ERROR: '$bin' is required." >&2; exit 2; }
done

MODE="seed"
case "${1:-}" in
  --stores) MODE="stores" ;;
  --check)  MODE="check" ;;
  "")       ;;
  *) echo "ERROR: unknown argument '$1' (expected --stores or --check)" >&2; exit 2 ;;
esac

FAILURES=0
fail() { FAILURES=$((FAILURES + 1)); printf '  %s\n' "$*" >&2; }
log() { printf '  %s\n' "$*" >&2; }
section() { printf '\n==> %s\n' "$*" >&2; }

list_today() {
  local res
  res=$(api GET /api/boxes "")
  body "$res" | jq -r '
    .data
    | if length == 0 then "  (nothing listed today)"
      else .[] | "  \(.storeName) — \(.name) — \(.status) — 剩 \(.remainingCount) — 取貨 \(.pickupTimeStart)-\(.pickupTimeEnd)"
      end'
}

api() { # api <METHOD> <path> <bearer-or-empty> [json-body] -> body, then http code on the last line
  local method="$1" path="$2" auth="$3" body="${4:-}"
  local args=(-sS -X "$method" "$BASE_URL$path" -H 'Content-Type: application/json' -w '\n%{http_code}')
  [ -n "$auth" ] && args+=(-H "Authorization: Bearer $auth")
  [ -n "$body" ] && args+=(-d "$body")
  curl "${args[@]}"
}
code() { tail -n1 <<<"$1"; }
body() { sed '$d' <<<"$1"; }

# ── The demo's stores ──────────────────────────────────────────────────────
# EVERY STORE BELOW IS INVENTED, and named so that nobody can mistake it for a real one.
# This demo is shown while a partnership is being proposed, so a listing that reads as an
# already-signed merchant is a claim nobody made. The （示範店）suffix is deliberate — keep it
# until these are replaced by real pilot merchants, and the webview says the same thing on the
# list and detail screens. It is a suffix rather than a prefix so each store still starts with
# a different character: the card falls back to the store-name initial when a listing has no
# photo, and six identical badges look like a rendering bug.
#
# Coordinates are within ~400 m of each station, so the walking estimate the UI shows
# (straight line x 1.3 / 80 m per minute) lands in the 2-7 minute range the pitch describes.
# Addresses are plausible street numbers near those points, not businesses.
#
# email|store name|address|lat|lng|category|pack name|origPrice|price|qty|pickupStart|pickupEnd
# Prices are whole TWD, as the app renders them (PriceDisplay: "NT$$price").
# Pickup windows are wide and staggered: wide so the demo reads as collectable whenever it is
# given, staggered so the list looks like six different shops rather than one copied six times.
STORES=$(cat <<'ROWS'
demo-longshan-bakery@freshtogo.test|麵包坊（示範店）|台北市萬華區西園路一段 120 號|25.0361|121.4985|BAKERY|隔日仍好吃・歐包綜合袋|220|75|6|15:00|22:00
demo-longshan-deli@freshtogo.test|便當屋（示範店）|台北市萬華區康定路 20 號|25.0348|121.5012|DELI|今日主菜便當包|160|75|5|16:30|22:30
demo-ximen-dessert@freshtogo.test|甜點店（示範店）|台北市萬華區漢中街 50 號|25.0435|121.5068|DESSERT|甜點櫃清空組|240|90|4|14:00|22:00
demo-ximen-deli@freshtogo.test|熟食舖（示範店）|台北市萬華區成都路 27 號|25.0427|121.5062|DELI|熱食櫃驚喜包|150|75|6|16:00|22:30
demo-taipei-cafe@freshtogo.test|咖啡館（示範店）|台北市中正區館前路 8 號|25.0455|121.5156|BEVERAGE|咖啡・麵包組|190|75|8|14:30|21:30
demo-taipei-bakery@freshtogo.test|吐司坊（示範店）|台北市中正區忠孝西路一段 47 號|25.0468|121.5162|BAKERY|當日吐司與丹麥組|200|75|5|15:30|22:00
ROWS
)

# The sale window opens at midnight and closes when that store's pickup window does. It cannot
# run any later: the backend rejects saleTimeEnd > pickupTimeEnd outright
# (BoxInputValidator.parseTimeWindows -> SaleEndsAfterPickupEnds), so "sell all day" would 400
# every listing and leave the demo empty. Opening at 00:00 means a pack is never BEFORE_SALE,
# and the pickup windows above run to 21:30-22:30 so an evening rehearsal still has something
# to reserve.
SALE_START="00:00"
TODAY="$(TZ=Asia/Taipei date +%Y-%m-%d)"

# ── Check: a public endpoint, so this runs before any credential is needed ──
if [ "$MODE" = "check" ]; then
  section "Today's listings on $BASE_URL"
  list_today
  exit 0
fi

# ── Admin session ──────────────────────────────────────────────────────────
: "${ADMIN_EMAIL:?set ADMIN_EMAIL in scripts/.demo-seed.env}"
: "${ADMIN_PASSWORD:?set ADMIN_PASSWORD in scripts/.demo-seed.env}"
: "${MERCHANT_PASSWORD:?set MERCHANT_PASSWORD in scripts/.demo-seed.env}"

section "Signing in as admin"
res=$(api POST /api/admin/login "" "$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" '{email:$e,password:$p}')")
[ "$(code "$res")" = "200" ] || { echo "Admin login failed: $(body "$res")" >&2; exit 1; }
# `.data.token`, not `.data.accessToken` — AdminResponse (models/Admin.kt) and
# MerchantResponse both call it `token`, where the consumer's SessionInfo calls it
# accessToken. Reading the wrong field yields jq's "null", every admin call then goes out as
# `Bearer null`, and a 401 with an empty body is reported as six stores that failed for no
# stated reason. Hence the check: a login that answers 200 but carries nothing is a bug here,
# not a credential problem, and it should say so rather than limp on.
ADMIN_TOKEN=$(body "$res" | jq -r '.data.token // empty')
[ -n "$ADMIN_TOKEN" ] || {
  echo "Admin login answered 200 but carried no token — the response shape has changed." >&2
  exit 1
}
log "ok"

# ── Stores ─────────────────────────────────────────────────────────────────
section "Stores"
while IFS='|' read -r email name address lat lng category pack original discounted qty pickup_start pickup_end; do
  [ -z "$email" ] && continue
  payload=$(jq -nc --arg e "$email" --arg p "$MERCHANT_PASSWORD" --arg n "$name" \
    --arg a "$address" --argjson lat "$lat" --argjson lng "$lng" \
    '{email:$e,password:$p,storeName:$n,storeAddress:$a,storeLatitude:$lat,storeLongitude:$lng,timezone:"Asia/Taipei"}')
  res=$(api POST /api/admin/merchants "$ADMIN_TOKEN" "$payload")
  case "$(code "$res")" in
    201) log "created  $name" ;;
    409) log "exists   $name" ;;
    *)   fail "FAILED   $name — $(body "$res")" ;;
  esac
done <<<"$STORES"

[ "$MODE" = "stores" ] && { section "Done (stores only)"; exit 0; }

# ── Today's packs ──────────────────────────────────────────────────────────
section "Packs for $TODAY"
while IFS='|' read -r email name address lat lng category pack original discounted qty pickup_start pickup_end; do
  [ -z "$email" ] && continue

  res=$(api POST /api/merchant/login "" "$(jq -nc --arg e "$email" --arg p "$MERCHANT_PASSWORD" '{email:$e,password:$p}')")
  if [ "$(code "$res")" != "200" ]; then
    fail "FAILED   $name — merchant login: $(body "$res")"
    continue
  fi
  token=$(body "$res" | jq -r '.data.token // empty')
  if [ -z "$token" ]; then
    fail "FAILED   $name — merchant login answered 200 but carried no token"
    continue
  fi

  # Already listed today? Leave it — re-running must not double the stock.
  res=$(api GET /api/merchant/boxes "$token")
  existing=$(body "$res" | jq -r --arg p "$pack" --arg d "$TODAY" \
    '[.data[]? | select(.name == $p and .saleDate == $d)] | length')
  if [ "${existing:-0}" != "0" ]; then
    log "exists   $name — $pack"
    continue
  fi

  payload=$(jq -nc --arg n "$pack" --argjson o "$original" --argjson d "$discounted" \
    --argjson q "$qty" --arg ps "$pickup_start" --arg pe "$pickup_end" \
    --arg ss "$SALE_START" --arg se "$pickup_end" --arg date "$TODAY" --arg c "$category" \
    '{name:$n,originalPrice:$o,discountedPrice:$d,quantity:$q,
      pickupTimeStart:$ps,pickupTimeEnd:$pe,saleTimeStart:$ss,saleTimeEnd:$se,
      saleDate:$date,category:$c}')
  res=$(api POST /api/merchant/boxes "$token" "$payload")
  case "$(code "$res")" in
    201|200) log "created  $name — $pack" ;;
    *)       fail "FAILED   $name — $pack: $(body "$res")" ;;
  esac
done <<<"$STORES"

# The webview mints a fresh consumer per session (see src/api/session.ts), so there is nothing
# to clean up here: no order history to clear, no 409 from a rehearsal, no no-show block. The
# shared demo consumer belongs to the Android E2E suite now, and this script deliberately does
# not touch it.

section "What the demo will show"
list_today

if [ "$FAILURES" -gt 0 ]; then
  section "$FAILURES step(s) failed — read the FAILED lines above before relying on this"
  exit 1
fi

# dev.handyla.co, never freshtogo-dev.web.app: the dev API's CORS allow-list holds the first
# and not the second, so the .web.app copy loads and then cannot fetch anything.
section "Done — open https://dev.handyla.co/easywallet"
