import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Lang } from '../i18n'
import { SUPPORT_EMAIL, type LegalContent } from './legalContent'
import './LegalPage.css'

/** Linkify the support email inside a string of body text. */
function renderText(text: string): ReactNode {
  const parts = text.split(SUPPORT_EMAIL)
  if (parts.length === 1) return text
  return parts.flatMap((part, idx) =>
    idx === 0
      ? [part]
      : [
          <a key={idx} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,
          part,
        ],
  )
}

export default function LegalPage({ content }: { content: LegalContent }) {
  const [lang, setLang] = useState<Lang>(/^zh\b/i.test(navigator.language) ? 'zh' : 'en')
  const doc = content[lang]
  const brand = lang === 'zh' ? '鮮款款' : 'FreshToGo'
  const backLabel = lang === 'zh' ? '← 返回首頁' : '← Back to Home'

  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-brand">{brand}</Link>
        <button
          className="legal-lang-toggle"
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </header>

      <main className="legal-content">
        <h1 className="legal-title">{doc.title}</h1>
        <p className="legal-updated">{doc.updated}</p>

        {doc.sections.map((section, si) => (
          <section key={si} className="legal-section">
            <h2>{section.heading}</h2>
            {section.blocks.map((block, bi) => {
              switch (block.kind) {
                case 'p':
                  return <p key={bi}>{renderText(block.text)}</p>
                case 'subtitle':
                  return <p key={bi} className="legal-subtitle">{block.text}</p>
                case 'bullets':
                  return (
                    <ul key={bi}>
                      {block.items.map((item, ii) => (
                        <li key={ii}>{renderText(item)}</li>
                      ))}
                    </ul>
                  )
                case 'warning':
                  return <div key={bi} className="legal-warning">{renderText(block.text)}</div>
                default:
                  return null
              }
            })}
          </section>
        ))}

        <Link to="/" className="legal-back">{backLabel}</Link>
      </main>
    </div>
  )
}
