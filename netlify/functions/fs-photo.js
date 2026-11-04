// GET /fs/v0/b/<bucket de PETFILE>/o/<ruta>?alt=media&token=<token>
// Lee una foto de los registros para armar el PDF, desde el mismo dominio.
// Solo sirve imágenes de PETFILE: nunca otro bucket, otra ruta ni contenido que el navegador pueda ejecutar.
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'petfile-15279.firebasestorage.app';
const OBJECT_RE = /^families\/[A-Za-z0-9_-]{1,128}\/pets\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-]{1,128}\.(?:jpe?g|png|webp)$/;
const TOKEN_RE = /^[A-Za-z0-9-]{16,64}$/;
const MAX_BYTES = 3 * 1024 * 1024;
const TYPES = { 'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP' };
const SAFE = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; sandbox",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cache-Control': 'private, no-store',
};
const fail = (statusCode) => ({ statusCode, headers: { ...SAFE, 'Content-Type': 'text/plain; charset=utf-8' }, body: '' });

// Ruta del objeto, venga codificada o no según cómo la entregue Netlify.
function objectPath(event) {
  let raw = '';
  try { raw = event.rawUrl ? new URL(event.rawUrl).pathname : event.path || ''; } catch { return null; }
  const prefix = `/v0/b/${BUCKET}/o/`;
  const at = raw.indexOf(prefix);
  const tail = at >= 0 ? raw.slice(at + prefix.length) : (raw.split('/fs-photo/')[1] || '');
  try { return decodeURIComponent(tail); } catch { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return fail(405);
  const object = objectPath(event);
  const q = event.queryStringParameters || {};
  if (!object || !OBJECT_RE.test(object) || q.alt !== 'media' || !TOKEN_RE.test(q.token || '')) return fail(404);
  try {
    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(object)}?alt=media&token=${q.token}`;
    const r = await fetch(url, { redirect: 'error' });
    if (!r.ok) return fail(404);
    const type = String(r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const buf = Buffer.from(await r.arrayBuffer());
    if (!TYPES[type] || buf.length > MAX_BYTES || buf.length < 12 || !TYPES[type](buf)) return fail(415);
    return { statusCode: 200, headers: { ...SAFE, 'Content-Type': type, 'Content-Disposition': 'inline; filename="foto"' }, body: buf.toString('base64'), isBase64Encoded: true };
  } catch (e) {
    console.error('fs-photo', e);
    return fail(502);
  }
};
