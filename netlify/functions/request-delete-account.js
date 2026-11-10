// POST /.netlify/functions/request-delete-account
// Recibe una solicitud pública de eliminación. NUNCA borra la cuenta.
// Envía el pedido al correo administrativo (FormSubmit) para verificación de titularidad.
const { firebase, json } = require('../lib/common');

const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'grupoarcacr@gmail.com';
const FORMSUBMIT = 'https://formsubmit.co/ajax/' + ADMIN_EMAIL;
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

// Límite suave en memoria del contenedor (mejora abuso básico; no es un firewall).
const hits = new Map();

const cors = () => ({
  'Access-Control-Allow-Origin': 'https://petfilearca.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
});

const okBody = () => JSON.stringify({
  ok: true,
  received: true,
  deleted: false,
  message: 'request_received',
});

function prune(key, now) {
  const list = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  hits.set(key, list);
  return list;
}

function clientIp(event) {
  const h = event.headers || {};
  return String(h['x-nf-client-connection-ip'] || h['client-ip'] || h['x-forwarded-for'] || '')
    .split(',')[0].trim() || 'unknown';
}

function parseBody(event) {
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '');
    return JSON.parse(raw || '{}');
  } catch {
    return null;
  }
}

async function accountHint(email) {
  try {
    const admin = firebase();
    await admin.auth().getUserByEmail(email);
    return 'sí (Firebase Auth)';
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') return 'no encontrada en Auth (o ya eliminada)';
    return 'no verificado (error de consulta)';
  }
}

exports.handler = async (event) => {
  const headers = cors();
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'method' }) };

  const body = parseBody(event);
  if (!body || typeof body !== 'object') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid' }) };
  }

  // Honeypot: si un bot lo llena, respondemos igual (sin procesar) para no filtrar señales.
  if (String(body.website || body.company || '').trim()) {
    return { statusCode: 200, headers, body: okBody() };
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'email' }) };
  }
  if (body.confirm !== true) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'confirm' }) };
  }

  const now = Date.now();
  const ip = clientIp(event);
  const ipHits = prune('ip:' + ip, now);
  const mailHits = prune('em:' + email, now);
  if (ipHits.length >= MAX_PER_IP || mailHits.length >= MAX_PER_EMAIL) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'rate' }) };
  }
  ipHits.push(now);
  mailHits.push(now);
  hits.set('ip:' + ip, ipHits);
  hits.set('em:' + email, mailHits);

  const note = String(body.note || '').trim().slice(0, 500);
  const lang = body.lang === 'en' ? 'en' : 'es';
  const hint = await accountHint(email);
  const fecha = new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' });
  const message = [
    'Solicitud pública de eliminación de cuenta PETFILE.',
    '',
    'IMPORTANTE: esto NO elimina la cuenta. Verificar titularidad escribiendo a este correo antes de borrar.',
    '',
    'Correo declarado: ' + email,
    'Idioma del formulario: ' + lang,
    '¿Existe en Auth?: ' + hint,
    'Fecha (CR): ' + fecha,
    note ? ('Nota del solicitante: ' + note) : 'Nota del solicitante: (ninguna)',
    '',
    'Proceso sugerido: 1) responder al correo declarado, 2) confirmar que es el titular, 3) pedir que elimine desde la app (Mi cuenta → Eliminar mi cuenta) o ejecutar el borrado autenticado solo tras esa verificación.',
  ].join('\n');

  try {
    const r = await fetch(FORMSUBMIT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'PETFILE - Solicitud de eliminación de cuenta',
        _template: 'basic',
        _captcha: 'false',
        name: 'Solicitud eliminación',
        email,
        message,
      }),
    });
    const j = await r.json().catch(() => ({}));
    // FormSubmit a veces responde pidiendo activar el buzón la primera vez; igual consideramos recibida.
    if (!r.ok && String(j.success) === 'false' && !/activ/i.test(j.message || '')) {
      console.error('request-delete-account formsubmit', r.status);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'send' }) };
    }
  } catch (e) {
    console.error('request-delete-account', e);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'send' }) };
  }

  return { statusCode: 200, headers, body: okBody() };
};
