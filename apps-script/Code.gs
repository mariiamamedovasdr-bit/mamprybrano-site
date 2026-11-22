/**
 * «Мам, прибрано!» — приймання заявок із сайту.
 * Заявка падає в таблицю «Замовлення» і приходить повідомленням у Telegram.
 *
 * Налаштування (один раз): Project Settings → Script properties
 *   TELEGRAM_TOKEN   — токен бота від @BotFather
 *   TELEGRAM_CHAT_ID — id чату або групи, куди слати заявки
 */

const SHEET_NAME = 'Замовлення';

function doPost(e) {
  try {
    const data = parseBody_(e);

    // Простий захист від спам-ботів: приховане поле "website" має бути порожнім
    if (data.website) return json_({ ok: true });

    if (!data.phone || String(data.phone).replace(/\D/g, '').length < 9) {
      return json_({ ok: false, error: 'phone' });
    }

    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
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
    'Таблиця: ' + SpreadsheetApp.getActive().getUrl()
  ].filter(Boolean).join('\n');

  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true }),
    muteHttpExceptions: true
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Запустіть вручну один раз, щоб перевірити, що Telegram працює. */
function testTelegram() {
  notifyTelegram_({ package: 'Тест', rooms: '1', name: 'Перевірка', phone: '+380000000000' });
}
