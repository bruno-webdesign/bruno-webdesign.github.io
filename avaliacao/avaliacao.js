(() => {
  'use strict';
  const endpoint = 'https://avaliacoes-projetos.bruniversamente.workers.dev';
  const token = new URLSearchParams(location.hash.slice(1)).get('convite');
  let receivingEnabled = false;
  let submitting = false;
  const form = document.querySelector('#evaluation-form');
  const complete = document.querySelector('#complete-panel');
  const error = document.querySelector('#form-error');
  const publication = document.querySelector('#publication-fields');
  const publicName = document.querySelector('#public-name');
  const submit = form.querySelector('button[type=submit]');
  const status = document.querySelector('#availability-status');
  const request = async (path, payload) => {
    const response = await fetch(endpoint + path, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload), signal: AbortSignal.timeout(25000),
      credentials: 'omit', referrerPolicy: 'no-referrer',
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message || 'Não foi possível confirmar o envio. Tente novamente; se continuar, fale com Bruno.');
    return result;
  };
  const noteLabels = ['Muito insatisfeito', 'Insatisfeito', 'Nem satisfeito nem insatisfeito', 'Satisfeito', 'Muito satisfeito'];
  const showError = (message, field) => {
    error.textContent = message;
    error.hidden = false;
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      const section = field.closest('details');
      if (section) section.open = true;
    }
    error.focus();
  };
  const clearError = () => {
    error.hidden = true;
    error.textContent = '';
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  };
  const showThanks = () => {
    receivingEnabled = false;
    status.textContent = 'Avaliação recebida.';
    form.hidden = true;
    complete.hidden = false;
    complete.focus({preventScroll: true});
    document.querySelector('.form-card').scrollIntoView({block: 'start', behavior: 'auto'});
  };
  const syncPublication = () => {
    const allow = form.querySelector('input[name=publish]').checked;
    publication.hidden = !allow;
    publicName.disabled = !allow;
  };
  form.addEventListener('input', clearError);
  form.addEventListener('change', event => {
    clearError();
    if (event.target.name === 'publish') syncPublication();
    if (event.target.name === 'rating') {
      form.querySelectorAll('input[name=rating]').forEach(input => {
        input.nextElementSibling.querySelector('b').textContent = input.checked ? '★' : '☆';
      });
      document.querySelector('#rating-description').textContent = `${event.target.value} de 5 · ${noteLabels[Number(event.target.value) - 1]}`;
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    if (!receivingEnabled) return showError('Abra o link de avaliação enviado por Bruno.');
    clearError();
    const values = new FormData(form);
    const text = key => String(values.get(key) || '').trim();
    if (!text('rating')) return showError('Escolha uma nota de 1 a 5 para continuar.', form.querySelector('input[name=rating]'));
    const testimonial = text('testimonial');
    const permission = text('publish');
    const publicTestimonial = Boolean(testimonial && permission === 'yes');
    if (publicTestimonial && !text('publicName')) return showError('Informe o nome para divulgação.', publicName);
    submitting = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Enviando avaliação…';
    try {
      await request('/evaluations', {
        token, rating: Number(text('rating')),
        clientName: text('clientName'), projectName: text('projectName'),
        worked: text('worked'), improve: text('improve'), testimonial,
        publicName: text('publicName'), publish: permission === 'yes',
        portfolio: text('portfolio') === 'authorized',
      });
      showThanks();
    } catch (failure) {
      status.textContent = 'Envio não confirmado.';
      showError(failure.message);
    } finally {
      submitting = false;
      submit.disabled = !receivingEnabled;
      form.removeAttribute('aria-busy');
    }
  });
  syncPublication();
  (async () => {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      status.textContent = 'Abra o link de avaliação enviado por Bruno.';
      return;
    }
    try {
      const invitation = await request('/invitation', {token});
      if (invitation.alreadySubmitted) return showThanks();
      form.querySelector('[name=projectName]').value = invitation.projectTitle;
      receivingEnabled = true;
      submit.disabled = false;
      status.textContent = 'Sua avaliação é bem-vinda.';
    } catch (failure) {
      status.textContent = failure.message;
    }
  })();
})();
