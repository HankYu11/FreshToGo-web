import type { Lang } from '../i18n'

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'warning'; text: string }

export type Section = { heading: string; blocks: Block[] }
export type LegalDoc = { title: string; updated: string; sections: Section[] }
export type LegalContent = Record<Lang, LegalDoc>

export const SUPPORT_EMAIL = 'support@handyla.co'

export const privacyContent: LegalContent = {
  zh: {
    title: '隱私權政策',
    updated: '最後更新日期：2026 年 2 月 25 日',
    sections: [
      {
        heading: '1. 資料蒐集',
        blocks: [
          { kind: 'p', text: '我們透過 LINE 登入取得您的基本個人資料（包括顯示名稱與個人圖片）。我們也會蒐集您的訂單紀錄與預約資訊，以提供服務。' },
        ],
      },
      {
        heading: '2. 資料使用',
        blocks: [
          { kind: 'p', text: '您的資料僅用於以下目的：' },
          { kind: 'bullets', items: ['帳號驗證與身份識別', '處理驚喜箱預約與訂單', '提供客戶服務與通知', '改善我們的服務品質'] },
        ],
      },
      {
        heading: '3. 資料分享',
        blocks: [
          { kind: 'p', text: '我們不會將您的個人資料出售或分享給第三方，除非法律要求或經您同意。您的訂單資訊僅與相關店家分享，以完成訂單處理。' },
        ],
      },
      {
        heading: '4. 資料安全',
        blocks: [
          { kind: 'p', text: '我們採用業界標準的安全措施保護您的個人資料，包括加密傳輸與安全儲存。' },
        ],
      },
      {
        heading: '5. 資料刪除',
        blocks: [
          { kind: 'p', text: '您可以隨時要求刪除您的帳號與相關資料。請透過應用程式內的設定或聯繫我們進行帳號刪除。' },
        ],
      },
      {
        heading: '6. 聯絡方式',
        blocks: [
          { kind: 'p', text: `如對本隱私權政策有任何疑問，請透過應用程式內的客服功能，或來信 ${SUPPORT_EMAIL} 與我們聯繫。` },
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: February 25, 2026',
    sections: [
      {
        heading: '1. Data Collection',
        blocks: [
          { kind: 'p', text: 'We obtain your basic personal information (including display name and profile picture) through LINE Login. We also collect your order history and reservation details in order to provide our services.' },
        ],
      },
      {
        heading: '2. Use of Data',
        blocks: [
          { kind: 'p', text: 'Your data is used only for the following purposes:' },
          { kind: 'bullets', items: ['Account verification and identification', 'Processing Surprise Bag reservations and orders', 'Providing customer service and notifications', 'Improving our service quality'] },
        ],
      },
      {
        heading: '3. Data Sharing',
        blocks: [
          { kind: 'p', text: 'We do not sell or share your personal information with third parties, except as required by law or with your consent. Your order information is shared only with the relevant store to fulfill your order.' },
        ],
      },
      {
        heading: '4. Data Security',
        blocks: [
          { kind: 'p', text: 'We use industry-standard security measures to protect your personal information, including encrypted transmission and secure storage.' },
        ],
      },
      {
        heading: '5. Data Deletion',
        blocks: [
          { kind: 'p', text: 'You may request deletion of your account and associated data at any time. Please use the in-app settings or contact us to delete your account.' },
        ],
      },
      {
        heading: '6. Contact',
        blocks: [
          { kind: 'p', text: `If you have any questions about this Privacy Policy, please contact us through the in-app customer support feature or by email at ${SUPPORT_EMAIL}.` },
        ],
      },
    ],
  },
}

export const accountDeletionContent: LegalContent = {
  zh: {
    title: '帳號與資料刪除',
    updated: '最後更新日期：2026 年 2 月 26 日',
    sections: [
      {
        heading: '1. 如何刪除帳號',
        blocks: [
          { kind: 'p', text: '您可以透過以下方式刪除您的帳號與相關資料：' },
          { kind: 'subtitle', text: '方式一：透過應用程式' },
          { kind: 'bullets', items: ['開啟鮮款款 App', '前往「我的」頁面', '點選「刪除帳號」', '確認刪除'] },
          { kind: 'subtitle', text: '方式二：透過電子郵件' },
          { kind: 'bullets', items: [`寄送電子郵件至 ${SUPPORT_EMAIL}`, '主旨請註明「帳號刪除申請」', '內文請提供您的 LINE 顯示名稱，以利我們識別您的帳號', '我們將在收到申請後 7 個工作天內處理'] },
        ],
      },
      {
        heading: '2. 刪除的資料範圍',
        blocks: [
          { kind: 'p', text: '帳號刪除後，以下資料將被永久移除：' },
          { kind: 'bullets', items: ['使用者個人資料（LINE 顯示名稱、個人圖片）', '所有預約紀錄', '認證令牌（JWT、Refresh Token）', '推播通知令牌（FCM Token）'] },
          { kind: 'warning', text: '請注意：帳號刪除後，所有資料將立即且永久地從我們的系統中移除，無法復原。若您有進行中的預約，系統將自動取消。' },
        ],
      },
      {
        heading: '3. 聯絡我們',
        blocks: [
          { kind: 'p', text: `如有任何關於帳號刪除的問題，請聯繫：${SUPPORT_EMAIL}` },
        ],
      },
    ],
  },
  en: {
    title: 'Account & Data Deletion',
    updated: 'Last updated: February 26, 2026',
    sections: [
      {
        heading: '1. How to Delete Your Account',
        blocks: [
          { kind: 'p', text: 'You can delete your account and associated data in either of the following ways:' },
          { kind: 'subtitle', text: 'Option 1: In the app' },
          { kind: 'bullets', items: ['Open the FreshToGo app', 'Go to the "My" page', 'Tap "Delete Account"', 'Confirm the deletion'] },
          { kind: 'subtitle', text: 'Option 2: By email' },
          { kind: 'bullets', items: [`Email us at ${SUPPORT_EMAIL}`, 'Use the subject "Account Deletion Request"', 'Include your LINE display name so we can identify your account', 'We will process your request within 7 business days'] },
        ],
      },
      {
        heading: '2. Data That Will Be Deleted',
        blocks: [
          { kind: 'p', text: 'After account deletion, the following data will be permanently removed:' },
          { kind: 'bullets', items: ['User personal information (LINE display name, profile picture)', 'All reservation records', 'Authentication tokens (JWT, Refresh Token)', 'Push notification token (FCM Token)'] },
          { kind: 'warning', text: 'Please note: After account deletion, all data will be immediately and permanently removed from our systems and cannot be recovered. Any reservations in progress will be automatically canceled.' },
        ],
      },
      {
        heading: '3. Contact Us',
        blocks: [
          { kind: 'p', text: `If you have any questions about account deletion, please contact: ${SUPPORT_EMAIL}` },
        ],
      },
    ],
  },
}
