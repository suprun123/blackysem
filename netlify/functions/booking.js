exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { statusCode: 500, body: 'Server is not configured' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const name = String(data.name || '').slice(0, 200);
  const phone = String(data.phone || '').slice(0, 200);
  const service = String(data.service || '').slice(0, 200);
  const breed = String(data.breed || '').slice(0, 200);
  const notes = String(data.notes || '').slice(0, 1000);

  if (!name || !phone || !service) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const lines = [
    'Нова заявка на запис — БЛЕКУСЕМ',
    `Ім'я: ${name}`,
    `Контакт: ${phone}`,
    `Послуга: ${service}`,
  ];
  if (breed) lines.push(`Порода/тварина: ${breed}`);
  if (notes) lines.push(`Коментар: ${notes}`);

  const text = lines.join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { statusCode: 502, body: `Telegram API error: ${detail}` };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 502, body: `Failed to reach Telegram: ${err.message}` };
  }
};
