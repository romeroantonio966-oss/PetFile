// Función programada (cada hora): manda notificaciones de PETFILE al celular.
// - A las 7:00 de la hora local de cada persona: resumen de lo que toca hoy y mañana.
// - Una hora antes de cada cita con hora.
// Solo para familias con Premium (licencia activa).
const webpush = require('web-push');
const { firebase, json } = require('../lib/common');

const TRIAL_DAYS = 0; // sin prueba gratis
const DAILY_HOUR = 7;

const TXT = {
  es: {
    today: 'Hoy', tomorrow: 'Mañana', overdue: (n) => `${n} vencido${n > 1 ? 's' : ''}`,
    more: (n) => `y ${n} más`, booster: 'Refuerzo', deworm: 'Desparasitar', ends: 'Termina',
    appt: (h) => `Cita a las ${h}`, title: 'PETFILE · Tus mascotas',
  },
  en: {
    today: 'Today', tomorrow: 'Tomorrow', overdue: (n) => `${n} overdue`,
    more: (n) => `and ${n} more`, booster: 'Booster', deworm: 'Deworming', ends: 'Ends',
    appt: (h) => `Appointment at ${h}`, title: 'PETFILE · Your pets',
  },
};

function localParts(tz, date = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), stamp: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` };
}
const addDays = (day, n) => { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function familyPremium(f) {
  const now = Date.now();
  const paid = f.paidUntil && f.paidUntil.toDate ? f.paidUntil.toDate().getTime() : 0;
  const start = f.trialStart && f.trialStart.toDate ? f.trialStart.toDate().getTime() : 0;
  return paid > now || (start && now < start + TRIAL_DAYS * 864e5);
}

// Las suscripciones las escribe el cliente: solo se envía a los servicios de notificaciones de los navegadores.
const PUSH_HOST_RE = /^(?:fcm\.googleapis\.com|web\.push\.apple\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)$/;
function pushAllowed(endpoint) {
  try { const u = new URL(endpoint); return u.protocol === 'https:' && !u.port && PUSH_HOST_RE.test(u.hostname); } catch { return false; }
}
function validTz(tz) {
  try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); return true; } catch { return false; }
}
const text = (v) => typeof v === 'string';

// Mismos recordatorios que muestra la app.
function reminders(pets, L) {
  const out = [];
  for (const p of pets) for (const e of Array.isArray(p.entries) ? p.entries : []) {
    if (!e || e.done) continue;
    if ((e.type === 'vacuna' || e.type === 'desp') && text(e.next)) out.push({ when: e.next, text: `${e.type === 'vacuna' ? L.booster : L.deworm} · ${e.title} (${p.name})` });
    else if (e.type === 'cita' && text(e.date)) out.push({ when: e.date, text: `${e.title} (${p.name})`, cita: true });
    else if (e.type === 'med' && text(e.end)) out.push({ when: e.end, text: `${L.ends} · ${e.title} (${p.name})` });
  }
  return out;
}

const run = async () => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return json(200, { skipped: 'faltan las claves VAPID' });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:grupoarcacr@gmail.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const admin = firebase();
  const db = admin.firestore();
  const subs = await db.collectionGroup('push').get();
  const userCache = {}, famCache = {};
  let sent = 0, removed = 0;

  for (const doc of subs.docs) {
   // Un dato dañado de una cuenta no debe frenar los avisos de las demás.
   try {
    const uid = doc.ref.parent.parent.id;
    const d = doc.data();
    if (!d.sub || !pushAllowed(d.sub.endpoint)) continue;
    const tz = validTz(d.tz) ? d.tz : 'America/Costa_Rica';
    const L = TXT[d.lang === 'en' ? 'en' : 'es'];
    const now = localParts(tz);
    const in1h = localParts(tz, new Date(Date.now() + 60 * 60e3)).stamp;
    const in2h = localParts(tz, new Date(Date.now() + 120 * 60e3)).stamp;

    if (!(uid in userCache)) { const u = await db.collection('users').doc(uid).get(); userCache[uid] = u.exists ? (u.get('familyId') || uid) : null; }
    const fid = userCache[uid];
    if (!fid) continue;
    if (!(fid in famCache)) {
      const f = await db.collection('families').doc(fid).get();
      if (!f.exists || !(f.get('members') || []).includes(uid) || !familyPremium(f.data())) { famCache[fid] = null; }
      else { const ps = await db.collection('families').doc(fid).collection('pets').get(); famCache[fid] = ps.docs.map((x) => x.data()); }
    }
    const pets = famCache[fid];
    if (!pets || !pets.length) continue;
    const rem = reminders(pets, L);
    const messages = [];

    // Resumen diario
    if (now.hour === DAILY_HOUR) {
      const tomorrow = addDays(now.day, 1);
      const hoy = rem.filter((r) => r.when.slice(0, 10) === now.day);
      const man = rem.filter((r) => r.when.slice(0, 10) === tomorrow);
      const venc = rem.filter((r) => r.when.slice(0, 10) < now.day && r.when.slice(0, 10) >= addDays(now.day, -60)).length;
      if (hoy.length || man.length) {
        const lines = [...hoy.map((r) => `${L.today}: ${r.text}`), ...man.map((r) => `${L.tomorrow}: ${r.text}`)];
        let body = lines.slice(0, 3).join('\n');
        if (lines.length > 3) body += `\n${L.more(lines.length - 3)}`;
        if (venc) body += `\n${L.overdue(venc)}`;
        messages.push({ title: L.title, body, tag: 'petfile-dia-' + now.day, url: './#agenda' });
      }
    }
    // Citas en la próxima hora
    for (const r of rem) {
      if (r.cita && r.when.includes('T') && r.when >= in1h && r.when < in2h) {
        messages.push({ title: L.appt(r.when.slice(11, 16)), body: r.text, tag: 'petfile-cita-' + r.when, url: './#agenda' });
      }
    }

    for (const m of messages) {
      try { await webpush.sendNotification(d.sub, JSON.stringify(m), { TTL: 3600 }); sent++; }
      catch (e) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) { await doc.ref.delete().catch(() => {}); removed++; break; }
        console.warn('push', e && e.statusCode);
      }
    }
   } catch (e) { console.error('send-reminders: suscripción', e); }
  }
  return json(200, { ok: true, sent, removed, subscriptions: subs.size });
};

exports.handler = async () => {
  try { return await run(); }
  catch (e) { console.error('send-reminders', e); return json(500, { error: 'server' }); }
};
