// AI 打包師 demo: one Gemini call turns a photo of what's left on the counter into
// packing options and a packing list. Dev-only — see ./enabled.ts.
//
// The API key never ships in the bundle. The person running the demo pastes it into the page
// once; it stays in that browser's localStorage and is sent only to Google.

const KEY_STORAGE = 'demo.geminiApiKey'
const MODEL_STORAGE = 'demo.geminiModel'
export const DEFAULT_MODEL = 'gemini-flash-latest'

export function loadKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) ?? '' } catch { return '' }
}
export function saveKey(key: string) {
  try { localStorage.setItem(KEY_STORAGE, key.trim()) } catch { /* private mode: key lives for this page only */ }
}
export function loadModel(): string {
  try { return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL } catch { return DEFAULT_MODEL }
}
export function saveModel(model: string) {
  try { localStorage.setItem(MODEL_STORAGE, model.trim() || DEFAULT_MODEL) } catch { /* ignore */ }
}

export interface Item { name: string; count: number; unitPrice: number }
export interface BagLine { name: string; count: number }
export interface PackOption {
  label: string
  bags: number
  price: number
  valuePerBag: number
  reason: string
  packingList: BagLine[][]
}
export interface PackResult {
  items: Item[]
  totalValue: number
  options: PackOption[]
  recommended: number
  recommendationReason: string
  title: string
  hint: string
  repaired: boolean[]
}

const PROMPT = `你是「鮮款款」的 AI 打包師，協助台灣在地小店把收店前剩下的商品，打包成「鮮款包」上架。
鮮款包是店家配好的一份組合，內容打開才知道，價格比平常買更划算。

請看照片，完成：
1. 辨識照片中的商品品項與數量，並依台灣一般小店售價估計每項原價（新台幣整數）。
2. 提出兩種包法：
   - 第一種「少量・單價高」：包數較少、每包內容較多。
   - 第二種「多量・單價低」：包數較多、每包內容較少。
   每包售價約為每包原價總值的 35%–45%，取整到個位數為 9 的價格（例如 79、89、129、149）。
3. 選出建議的包法（recommended 為 0 或 1），並用一句話說明理由（依商品數量、價值與一般購買習慣判斷，不要宣稱看過任何成交紀錄）。
4. 每一種包法都要給出打包單：
   - 所有辨識到的商品都必須剛好分配完，數量不能多也不能少。
   - 每包的原價總值盡量平均。
   - 每包盡量搭配不同品項，不要整包都是同一種。
5. 為這批鮮款包取一個標題（例如「麵包鮮款包」），以及一句給消費者看的提示：只描述食物的類型與大約數量（例如「今天現烤的麵包，老闆幫你挑 4–5 款，打開才知道是哪些」），不要列出確切內容。
   標題與提示禁止使用這些字：驚喜包、福袋、盲盒、剩食、惜食包、即期、過期。

如果照片裡看不到可以販售的食物，items 回傳空陣列。
全部使用繁體中文（台灣用語）。`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: { type: 'STRING' }, count: { type: 'INTEGER' }, unitPrice: { type: 'INTEGER' } },
        required: ['name', 'count', 'unitPrice'],
      },
    },
    options: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          bags: { type: 'INTEGER' },
          price: { type: 'INTEGER' },
          reason: { type: 'STRING' },
          packingList: {
            type: 'ARRAY',
            items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: { name: { type: 'STRING' }, count: { type: 'INTEGER' } },
                required: ['name', 'count'],
              },
            },
          },
        },
        required: ['label', 'bags', 'price', 'reason', 'packingList'],
      },
    },
    recommended: { type: 'INTEGER' },
    recommendationReason: { type: 'STRING' },
    title: { type: 'STRING' },
    hint: { type: 'STRING' },
  },
  required: ['items', 'options', 'recommended', 'recommendationReason', 'title', 'hint'],
}

/** Shrinks the photo before upload: phone photos are 4–12 MB and the model needs far less. */
export async function toJpegBase64(file: Blob, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return dataUrl.slice(dataUrl.indexOf(',') + 1)
}

export async function analyse(imageBase64: string, note: string, apiKey: string, model: string): Promise<PackResult> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: PROMPT + (note.trim() ? `\n\n店家補充：${note.trim()}` : '') },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.4 },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    if (res.status === 400 && body.includes('API key')) throw new Error('API key 無效，請到「設定」重新輸入。')
    if (res.status === 404) throw new Error(`找不到模型「${model}」，請到「設定」換一個模型名稱。`)
    if (res.status === 429) throw new Error('呼叫次數太頻繁或額度不足，請稍後再試。')
    throw new Error(`Gemini 回應錯誤（${res.status}）`)
  }
  const data = await res.json()
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text
  if (!text) throw new Error('AI 沒有回傳結果，請換一張照片再試一次。')
  return normalise(JSON.parse(text))
}

type Raw = {
  items: Item[]
  options: Omit<PackOption, 'valuePerBag'>[]
  recommended: number
  recommendationReason: string
  title: string
  hint: string
}

function normalise(raw: Raw): PackResult {
  const items = raw.items
    .map((it) => ({ name: it.name.trim(), count: Math.max(0, Math.round(it.count)), unitPrice: Math.max(0, Math.round(it.unitPrice)) }))
    .filter((it) => it.name && it.count > 0)
  const totalValue = items.reduce((s, it) => s + it.count * it.unitPrice, 0)
  const repaired: boolean[] = []
  const options = raw.options.slice(0, 2).map((op) => {
    const bags = Math.max(1, Math.min(op.bags, items.reduce((s, it) => s + it.count, 0) || 1))
    let packingList = op.packingList
    const ok = packingList.length === bags && sameCounts(items, packingList)
    if (!ok) packingList = balancedPack(items, bags)
    repaired.push(!ok)
    return { ...op, bags, packingList, valuePerBag: bags ? Math.round(totalValue / bags) : 0 }
  })
  const recommended = raw.recommended === 1 && options.length > 1 ? 1 : 0
  return { items, totalValue, options, recommended, recommendationReason: raw.recommendationReason, title: raw.title, hint: raw.hint, repaired }
}

/** True when the bags hold exactly the recognised items — the model's arithmetic is not trusted. */
function sameCounts(items: Item[], bags: BagLine[][]): boolean {
  const want = new Map(items.map((it) => [it.name, it.count]))
  const got = new Map<string, number>()
  for (const bag of bags) for (const line of bag) got.set(line.name.trim(), (got.get(line.name.trim()) ?? 0) + line.count)
  if (want.size !== got.size) return false
  for (const [name, n] of want) if (got.get(name) !== n) return false
  return true
}

/**
 * Fallback when the model's packing list doesn't add up: deal the most valuable pieces first,
 * each to the bag with the lowest value so far, preferring a bag that doesn't have that item yet.
 */
export function balancedPack(items: Item[], bags: number): BagLine[][] {
  const pieces = items.flatMap((it) => Array.from({ length: it.count }, () => it)).sort((a, b) => b.unitPrice - a.unitPrice)
  const value = Array(bags).fill(0)
  const content: Map<string, number>[] = Array.from({ length: bags }, () => new Map())
  for (const p of pieces) {
    let best = 0
    for (let b = 1; b < bags; b++) {
      const score = (i: number) => value[i] + (content[i].has(p.name) ? p.unitPrice * 0.6 : 0)
      if (score(b) < score(best)) best = b
    }
    value[best] += p.unitPrice
    content[best].set(p.name, (content[best].get(p.name) ?? 0) + 1)
  }
  return content.map((m) => [...m].map(([name, count]) => ({ name, count })))
}
