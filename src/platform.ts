export type Platform = 'ios' | 'android' | 'web_mobile' | 'web_desktop'

export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  // iPadOS 13+ reports as MacIntel but has touch support
  const isIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/i.test(ua) || isIpad) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Mobi|Mobile/i.test(ua)) return 'web_mobile'
  return 'web_desktop'
}
