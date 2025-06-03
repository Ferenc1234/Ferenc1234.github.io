async function loadForm() {
  const res = await fetch('https://hidden-term-c0fc.frubacek.workers.dev/');
  const fields = await res.json();

  const container = document.getElementById('form-container');
  const form = document.createElement('form');
  form.id = 'dynamic-form';

  const errorsDiv = document.createElement('div');
  errorsDiv.style.color = 'red';
  errorsDiv.style.marginTop = '1rem';

  const successDiv = document.createElement('div');
  successDiv.style.color = 'lightgreen';
  successDiv.style.marginTop = '1rem';

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '1rem';

    const label = document.createElement('label');
    label.innerHTML = field.label + (field.required ? ' <span style="color:red">*</span>' : '') + ':';

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = field.type;
    }

    input.name = field.name;
    if (field.required) input.required = true;

    const errorMsg = document.createElement('div');
    errorMsg.style.color = 'red';
    errorMsg.style.fontSize = '0.9em';
    errorMsg.className = 'error-message';

    const validateField = () => {
      const val = input.value;
      let error = '';

      if (field.required) {
        if (!val || (field.type === 'file' && input.files.length === 0)) {
          error = `Pole ${field.label} je povinné.`;
        } else if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            error = 'Zadejte prosím platnou e-mailovou adresu.';
          }
        }
      }

      if (field.type === 'file') {
        const file = input.files[0];
        if (file && file.size > MAX_FILE_SIZE) {
          error = `Soubor "${file.name}" je příliš velký. Maximální velikost je 10MB.`;
        }
      }

      errorMsg.textContent = error;
      return error === '';
    };

    input.addEventListener(field.type === 'file' ? 'change' : 'input', validateField);

    label.appendChild(document.createElement('br'));
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(errorMsg);
    form.appendChild(wrapper);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';

  const textSpan = document.createElement('span');
  textSpan.textContent = 'Send';
  textSpan.style.visibility = 'visible';
  submitBtn.appendChild(textSpan);

  const spinner = document.createElement('span');
  spinner.style.border = '2px solid #f3f3f3';
  spinner.style.borderTop = '2px solid #7f5af0';
  spinner.style.borderRadius = '50%';
  spinner.style.width = '16px';
  spinner.style.height = '16px';
  spinner.style.animation = 'spin 1s linear infinite';
  spinner.style.position = 'absolute';
  spinner.style.top = '50%';
  spinner.style.left = '50%';
  spinner.style.transform = 'translate(-50%, -50%)';
  spinner.style.display = 'none';
  submitBtn.appendChild(spinner);

  form.appendChild(submitBtn);
  container.appendChild(form);
  container.appendChild(errorsDiv);
  container.appendChild(successDiv);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorsDiv.textContent = '';
    successDiv.textContent = '';

    let isValid = true;
    fields.forEach(field => {
      const input = form.elements[field.name];
      const errorMsg = input.closest('div').querySelector('.error-message');
      const fieldValid = errorMsg.textContent === '';
      if (!fieldValid) isValid = false;
    });

    if (!isValid) {
      errorsDiv.textContent = 'Prosím opravte chyby výše před odesláním.';
      return;
    }

    const formData = new FormData(form);

    spinner.style.display = 'inline-block';
    textSpan.style.visibility = 'hidden';
    submitBtn.disabled = true;

    try {
      const token = await grecaptcha.execute('6LeNLFQrAAAAAE1PT3plAyvknxmEemxdQv0KrPFS', { action: 'submit' });
      formData.append('captcha', token);

      const res = await fetch('https://hidden-term-c0fc.frubacek.workers.dev/', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        successDiv.textContent = result.message;
        form.reset();
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
      } else {
        errorsDiv.textContent = result.message || 'Neznámá chyba.';
        console.error('Chyba při odesílání e-mailu:', result.error);
      }
    } catch (err) {
      errorsDiv.textContent = 'Chyba sítě nebo serveru: ' + err.message;
    } finally {
      spinner.style.display = 'none';
      textSpan.style.visibility = 'visible';
      submitBtn.disabled = false;
    }
  });
}

loadForm();
