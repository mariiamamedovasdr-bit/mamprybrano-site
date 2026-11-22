/**
 * «Мам, прибрано!» — приймання заявок із сайту.
 * Заявка падає в таблицю «Замовлення», приходить листом на пошту і (за бажанням) у Telegram.
 *
 * Налаштування (один раз): Project Settings → Script properties
 *   TELEGRAM_TOKEN   — токен бота від @BotFather
 *   TELEGRAM_CHAT_ID — id чату або групи, куди слати заявки
 */

const SHEET_ID = '1Gao9SLELey1YAhCEtDSAjMwi11EHrUdSVjdQ8rg3low';
const SHEET_NAME = 'Замовлення';

function doPost(e) {
  try {
    const data = parseBody_(e);

    // Простий захист від спам-ботів: приховане поле "website" має бути порожнім
    if (data.website) return json_({ ok: true });

    if (!data.phone || String(data.phone).replace(/\D/g, '').length < 9) {
      return json_({ ok: false, error: 'phone' });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    sheet.appendRow([
      new Date(),                 // A Дата заявки
      clean_(data.name),          // B Ім’я
      "'" + clean_(data.phone),   // C Телефон (як текст, щоб не загубився +)
      clean_(data.package),       // D Ситуація (пакет)
      clean_(data.rooms),         // E Кімнат
      clean_(data.address),       // F Адреса
      clean_(data.date),          // G Бажана дата
      clean_(data.comment),       // H Коментар клієнта
      'Нова'                      // I Статус
    ]);

    notifyEmail_(data);
    notifyTelegram_(data);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function parseBody_(e) {
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) { /* не JSON */ }
  }
  return e.parameter || {};
}

function clean_(v) {
  // Обрізаємо довжину і не даємо тексту стати формулою в таблиці
  let s = String(v == null ? '' : v).trim().slice(0, 500);
  if (/^[=+\-@]/.test(s) && !/^\+\d/.test(s)) s = "'" + s;
  return s;
}

function notifyTelegram_(d) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_TOKEN');
  const chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;

  const text = [
    '🧽 Нова заявка — «Мам, прибрано!»',
    '',
    'Ситуація: ' + (d.package || '—'),
    'Кімнат: ' + (d.rooms || '—'),
    'Ім’я: ' + (d.name || '—'),
    'Телефон: ' + (d.phone || '—'),
    d.address ? 'Адреса: ' + d.address : '',
    d.date ? 'Бажана дата: ' + d.date : '',
    d.comment ? 'Коментар: ' + d.comment : '',
    '',
    'Таблиця: https://docs.google.com/spreadsheets/d/' + SHEET_ID
  ].filter(Boolean).join('\n');

  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true }),
    muteHttpExceptions: true
  });
}

function notifyEmail_(d) {
  const to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail();
  if (!to) return;
  const body = [
    'Ситуація: ' + (d.package || '—'),
    'Кімнат: ' + (d.rooms || '—'),
    'Ім’я: ' + (d.name || '—'),
    'Телефон: ' + (d.phone || '—'),
    'Бажана дата: ' + (d.date || '—'),
    '',
    'Таблиця: https://docs.google.com/spreadsheets/d/' + SHEET_ID
  ].join('\n');
  MailApp.sendEmail(to, 'Нова заявка — Мам, прибрано! (' + (d.package || 'сайт') + ')', body);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Запустіть вручну один раз, щоб перевірити, що Telegram працює. */
function testTelegram() {
  notifyTelegram_({ package: 'Тест', rooms: '1', name: 'Перевірка', phone: '+380000000000' });
}
