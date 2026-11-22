# Мам, прибрано! — сайт

Лендінг клінінгу «Мам, прибрано!» (Львів): https://mamprybrano.com.ua

- `public/` — те, що публікується на Cloudflare Pages (index.html, og.png, robots.txt, sitemap.xml, іконка). Кожен push у `main` оновлює сайт.
- `source/` — вихідні матеріали: шрифти Fixel (OFL), логотипи (SVG), фото «до / після», маскот Ладик.
- `apps-script/` — код Google Apps Script для прийому заявок у Google Таблицю й Telegram.

Аналітика: Google Tag Manager `GTM-TBW54K59`. Відправлена форма передає подію `generate_lead`.
