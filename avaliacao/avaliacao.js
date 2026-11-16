(() => {
  'use strict';
  const receivingEnabled = false;
  const form = document.querySelector('#evaluation-form');
  const complete = document.querySelector('#complete-panel');
  const error = document.querySelector('#form-error');
  const publication = document.querySelector('#publication-fields');
  const publicName = document.querySelector('#public-name');
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
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!receivingEnabled) return showError('A avaliação estará disponível em breve.');
    clearError();
    const values = new FormData(form);
    const text = key => String(values.get(key) || '').trim();
    if (!text('rating')) return showError('Escolha uma nota de 1 a 5 para continuar.', form.querySelector('input[name=rating]'));
    const testimonial = text('testimonial');
    const permission = text('publish');
    const publicTestimonial = Boolean(testimonial && permission === 'yes');
    if (publicTestimonial && !text('publicName')) return showError('Informe o nome para divulgação.', publicName);
    showThanks();
  });
  syncPublication();
})();
