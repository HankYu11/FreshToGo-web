import type { Lang } from '../i18n'

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'warning'; text: string }

export type Section = { heading: string; blocks: Block[] }
export type LegalDoc = { title: string; updated: string; intro?: string; sections: Section[] }
export type LegalContent = Record<Lang, LegalDoc>

export const SUPPORT_EMAIL = 'support@handyla.co'

export const privacyContent: LegalContent = {
  zh: {
    title: '隱私權政策',
    updated: '最後更新日期：2026 年 10 月 6 日',
    intro: '鮮款款（以下稱本服務）由奇斯科技有限公司（QI SI TECHNOLOGY LIMITED，統一編號 62071057）提供並負責營運。',
    sections: [
      {
        heading: '1. 資料蒐集',
        blocks: [
          { kind: 'p', text: '為提供服務，我們會蒐集以下資料：' },
          { kind: 'bullets', items: [
            '登入資料：您使用 LINE、Google 或 Apple 登入時，我們會取得該服務提供的基本個人資料，例如顯示名稱、個人圖片與電子郵件。使用 Apple 登入時，您可以選擇隱藏電子郵件。',
            '位置資訊：若您允許，我們會在您使用 App 時取得您的大致位置，用來顯示附近的店家、鮮款包與敲碗榜。',
            '使用紀錄：您的預約與訂單紀錄、追蹤的店家、敲碗與推薦的店家、評分，以及在狩獵模式中跳過的鮮款包。',
            '裝置資訊：用於傳送推播通知的裝置令牌。',
            '店家資料：店家帳號的聯絡資訊、店家資訊與上傳的照片。',
          ] },
        ],
      },
      {
        heading: '2. 資料使用',
        blocks: [
          { kind: 'p', text: '您的資料僅用於以下目的：' },
          { kind: 'bullets', items: ['帳號驗證與身份識別', '處理鮮款包預約與訂單', '顯示您附近的店家與鮮款包', '依敲碗與推薦，評估並邀請新的合作店家', '提供客戶服務與通知', '改善我們的服務品質'] },
        ],
      },
      {
        heading: '3. 資料分享',
        blocks: [
          { kind: 'p', text: '我們不會將您的個人資料出售或分享給第三方，除非法律要求或經您同意。您的訂單資訊僅與相關店家分享，以完成訂單處理。您透過 LINE、Google 或 Apple 登入時，該服務提供者會依其各自的隱私權政策處理您的登入資料。' },
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
          { kind: 'p', text: '您可以隨時要求刪除您的帳號與相關資料。請在 App 內前往「會員」→「設定」→「刪除帳號」，或聯繫我們進行帳號刪除。' },
        ],
      },
      {
        heading: '6. 聯絡方式',
        blocks: [
          { kind: 'p', text: `如對本隱私權政策有任何疑問，請透過應用程式內的客服功能，或來信 ${SUPPORT_EMAIL} 與我們聯繫。` },
          { kind: 'bullets', items: ['公司名稱：奇斯科技有限公司（QI SI TECHNOLOGY LIMITED）', '統一編號：62071057', '地址：108 臺北市萬華區開封街二段 39 號 1 樓', `電子郵件：${SUPPORT_EMAIL}`] },
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: October 6, 2026',
    intro: 'FreshToGo (the "Service") is provided and operated by QI SI TECHNOLOGY LIMITED (奇斯科技有限公司, Taiwan Unified Business No. 62071057).',
    sections: [
      {
        heading: '1. Data Collection',
        blocks: [
          { kind: 'p', text: 'To provide our services, we collect the following information:' },
          { kind: 'bullets', items: [
            'Sign-in information: when you sign in with LINE, Google or Apple, we receive the basic profile information that service provides, such as your display name, profile picture and email address. With Sign in with Apple you can choose to hide your email address.',
            'Location: if you allow it, we use your approximate location while you use the app to show nearby stores, fresh packs and the rally board.',
            'Activity: your reservations and order history, the stores you follow, the stores you rally for or recommend, your ratings, and the fresh packs you pass on in Hunt mode.',
            'Device information: a device token used to send you push notifications.',
            'Merchant information: merchant account contact details, store information and uploaded photos.',
          ] },
        ],
      },
      {
        heading: '2. Use of Data',
        blocks: [
          { kind: 'p', text: 'Your data is used only for the following purposes:' },
          { kind: 'bullets', items: ['Account verification and identification', 'Processing fresh pack reservations and orders', 'Showing stores and fresh packs near you', 'Evaluating and inviting new partner stores based on rallies and recommendations', 'Providing customer service and notifications', 'Improving our service quality'] },
        ],
      },
      {
        heading: '3. Data Sharing',
        blocks: [
          { kind: 'p', text: 'We do not sell or share your personal information with third parties, except as required by law or with your consent. Your order information is shared only with the relevant store to fulfill your order. When you sign in with LINE, Google or Apple, that provider handles your sign-in data under its own privacy policy.' },
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
          { kind: 'p', text: 'You may request deletion of your account and associated data at any time. In the app, go to Profile → Settings → Delete Account, or contact us to delete your account.' },
        ],
      },
      {
        heading: '6. Contact',
        blocks: [
          { kind: 'p', text: `If you have any questions about this Privacy Policy, please contact us through the in-app customer support feature or by email at ${SUPPORT_EMAIL}.` },
          { kind: 'bullets', items: ['Company: QI SI TECHNOLOGY LIMITED (奇斯科技有限公司)', 'Unified Business No.: 62071057', 'Address: 1F., No. 39, Sec. 2, Kaifeng St., Wanhua Dist., Taipei City 108, Taiwan', `Email: ${SUPPORT_EMAIL}`] },
        ],
      },
    ],
  },
}

export const accountDeletionContent: LegalContent = {
  zh: {
    title: '帳號與資料刪除',
    updated: '最後更新日期：2026 年 9 月 30 日',
    sections: [
      {
        heading: '1. 如何刪除帳號',
        blocks: [
          { kind: 'p', text: '您可以透過以下方式刪除您的帳號與相關資料：' },
          { kind: 'subtitle', text: '方式一：透過應用程式' },
          { kind: 'bullets', items: ['開啟鮮款款 App', '前往「會員」頁面', '點選「設定」', '點選「刪除帳號」並確認刪除'] },
          { kind: 'subtitle', text: '方式二：透過電子郵件' },
          { kind: 'bullets', items: [`寄送電子郵件至 ${SUPPORT_EMAIL}`, '主旨請註明「帳號刪除申請」', '內文請提供您的登入方式（LINE、Google 或 Apple）以及顯示名稱或電子郵件，以利我們識別您的帳號', '我們將在收到申請後 7 個工作天內處理'] },
        ],
      },
      {
        heading: '2. 刪除的資料範圍',
        blocks: [
          { kind: 'p', text: '帳號刪除後，以下資料將被永久移除：' },
          { kind: 'bullets', items: ['使用者個人資料（顯示名稱、個人圖片、電子郵件）', '所有預約紀錄', '認證令牌（JWT、Refresh Token）', '推播通知令牌（FCM Token）'] },
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
    updated: 'Last updated: September 30, 2026',
    sections: [
      {
        heading: '1. How to Delete Your Account',
        blocks: [
          { kind: 'p', text: 'You can delete your account and associated data in either of the following ways:' },
          { kind: 'subtitle', text: 'Option 1: In the app' },
          { kind: 'bullets', items: ['Open the FreshToGo app', 'Go to the "Profile" tab', 'Tap "Settings"', 'Tap "Delete Account" and confirm'] },
          { kind: 'subtitle', text: 'Option 2: By email' },
          { kind: 'bullets', items: [`Email us at ${SUPPORT_EMAIL}`, 'Use the subject "Account Deletion Request"', 'Include how you sign in (LINE, Google or Apple) and your display name or email address so we can identify your account', 'We will process your request within 7 business days'] },
        ],
      },
      {
        heading: '2. Data That Will Be Deleted',
        blocks: [
          { kind: 'p', text: 'After account deletion, the following data will be permanently removed:' },
          { kind: 'bullets', items: ['User personal information (display name, profile picture, email address)', 'All reservation records', 'Authentication tokens (JWT, Refresh Token)', 'Push notification token (FCM Token)'] },
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
