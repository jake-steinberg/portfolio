/* =============================================================================
   contact.js — the Contact page: sends the message form without leaving the
   page.

   The form posts to Formspree (its address is the form's action in
   contact.html), which emails the message on. Here we send it in the
   background and show a note under the button instead. If this script
   doesn't run, the form still works: it just posts and Formspree shows its
   own thank-you page.
   ============================================================================= */
(function () {
  const form = document.getElementById('cform');
  const status = document.getElementById('cstatus');
  if (!form) return;

  const say = (text, ok) => {
    status.textContent = text;
    status.className = 'status ' + (ok ? 'ok' : 'err');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.action.includes('FORMSPREE_ID')) {          // not set up yet
      say('The form isn’t connected yet — please email me instead.', false);
      return;
    }
    const button = form.querySelector('.send');
    button.disabled = true;
    say('Sending…', true);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      say('Thanks — your message is on its way. I’ll get back to you soon.', true);
    } catch (err) {
      say('Something went wrong sending that. Please try again, or email me instead.', false);
    } finally {
      button.disabled = false;
    }
  });
})();
