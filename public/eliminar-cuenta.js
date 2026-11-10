(function () {
  const ENDPOINT = '/.netlify/functions/request-delete-account';
  const CONTACT = 'grupoarcacr@gmail.com';
  const WAIT_KEY = 'petfile-del-req-last';
  const WAIT_MS = 60 * 1000;

  function $(sel, root) { return (root || document).querySelector(sel); }

  function setBusy(btn, on) {
    if (!btn) return;
    btn.disabled = !!on;
    btn.innerHTML = on ? '<span class="spinner" aria-hidden="true"></span>' : btn.dataset.label;
  }

  async function send(form) {
    const err = $('.err', form);
    const ok = $('.ok', form);
    const btn = $('button[type=submit]', form);
    if (err) { err.hidden = true; err.textContent = ''; }
    if (ok) ok.hidden = true;

    const email = (($('input[type=email]', form) || {}).value || '').trim().toLowerCase();
    const note = (($('textarea', form) || {}).value || '').trim();
    const confirm = !!(($('input[type=checkbox]', form) || {}).checked);
    const hp = (($('input[name=website]', form) || {}).value || '').trim();
    const lang = form.dataset.lang === 'en' ? 'en' : 'es';
    const t = lang === 'en'
      ? {
          email: 'Enter a valid email address.',
          confirm: 'Confirm that you are the account holder.',
          wait: 'You already sent a request a moment ago. Wait one minute to send another.',
          sent: 'We received your request. This does not delete the account yet. We will write to that email within 5 business days to verify ownership before deleting anything.',
          fail: 'Could not send the request. Check your connection or email ' + CONTACT + '.',
          rate: 'Too many requests. Try again later or email ' + CONTACT + '.',
        }
      : {
          email: 'Escribí un correo válido.',
          confirm: 'Confirmá que sos la persona titular de la cuenta.',
          wait: 'Ya enviaste una solicitud hace un momento. Esperá un minuto para enviar otra.',
          sent: 'Recibimos tu solicitud. Esto no elimina la cuenta todavía. Te escribiremos a ese correo en un máximo de 5 días hábiles para verificar que sos el titular antes de borrar nada.',
          fail: 'No se pudo enviar la solicitud. Revisá tu conexión o escribinos a ' + CONTACT + '.',
          rate: 'Demasiadas solicitudes. Intentá más tarde o escribinos a ' + CONTACT + '.',
        };

    if (hp) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.textContent = t.email; err.hidden = false; return;
    }
    if (!confirm) {
      err.textContent = t.confirm; err.hidden = false; return;
    }
    let last = 0;
    try { last = +localStorage.getItem(WAIT_KEY) || 0; } catch (e) {}
    if (Date.now() - last < WAIT_MS) {
      err.textContent = t.wait; err.hidden = false; return;
    }

    setBusy(btn, true);
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, note, confirm: true, lang, website: hp }),
      });
      const j = await r.json().catch(function () { return {}; });
      if (r.status === 429) throw Object.assign(new Error('rate'), { code: 'rate' });
      if (!r.ok || !j.ok || j.deleted) throw new Error(j.error || String(r.status));
      try { localStorage.setItem(WAIT_KEY, String(Date.now())); } catch (e) {}
      form.reset();
      ok.textContent = t.sent;
      ok.hidden = false;
    } catch (e) {
      err.textContent = e && e.code === 'rate' ? t.rate : t.fail;
      err.hidden = false;
    } finally {
      setBusy(btn, false);
    }
  }

  document.querySelectorAll('form.del-form').forEach(function (form) {
    const btn = $('button[type=submit]', form);
    if (btn) btn.dataset.label = btn.textContent;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      send(form);
    });
  });
})();
