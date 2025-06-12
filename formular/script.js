async function loadForm() {
  const res = await fetch('https://hidden-term-c0fc.frubacek.workers.dev/');
  const fields = await res.json();

  const container = document.getElementById('form-container');
  const form = document.createElement('form');
  form.id = 'dynamic-form';
  form.noValidate = true;

  const errorsDiv = document.createElement('div');
  errorsDiv.style.color = 'red';
  errorsDiv.style.marginTop = '1rem';

  const successDiv = document.createElement('div');
  successDiv.style.color = 'lightgreen';
  successDiv.style.marginTop = '1rem';

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const inputElements = {};
  const wrapperElements = {};

  const getFieldValue = (name) => {
    const el = inputElements[name];
    if (!el) return null;
    if (el instanceof NodeList) {
      const selected = Array.from(el).find(i => i.checked);
      return selected ? selected.value : null;
    }
    return el.value;
  };

  const updateVisibility = () => {
    fields.forEach(field => {
      if (field.dependsOn) {
        const targetValue = getFieldValue(field.dependsOn.field);
        const wrapper = wrapperElements[field.name];
        const shouldShow = targetValue === field.dependsOn.value;
        wrapper.style.display = shouldShow ? '' : 'none';
      }
    });
    checkFormValidity();
  };

  const checkFormValidity = () => {
    let isValid = true;

    fields.forEach(field => {
      const wrapper = wrapperElements[field.name];
      const input = inputElements[field.name];
      const visible = wrapper.style.display !== 'none';
      const val = input instanceof NodeList ? getFieldValue(field.name) : input.value;

      if (field.required && visible) {
        if (!val || (field.type === 'file' && input.files.length === 0)) {
          isValid = false;
        } else if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) isValid = false;
        } else if (field.type === 'radio') {
          const selected = Array.from(input).find(i => i.checked);
          if (!selected) isValid = false;
        }
        if (field.type === 'checkbox') {
          const checked = Array.from(input).some(i => i.checked);
          if (!checked) isValid = false;
        }
      }

      if (field.type === 'file' && visible) {
        let totalSize = 0;
        for (const file of input.files) {
          totalSize += file.size;
        }
        if (totalSize > MAX_FILE_SIZE) {
          isValid = false;
        }
      }
    });

    submitBtn.disabled = !isValid;
    submitBtn.style.backgroundColor = isValid ? '' : '#ccc';
    submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
    return isValid;
  };

  fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '1rem';
    wrapperElements[field.name] = wrapper;

    const label = document.createElement('label');
    label.innerHTML = field.label + (field.required ? ' <span style="color:red">*</span>' : '') + ':';

    const errorMsg = document.createElement('div');
    errorMsg.style.color = 'red';
    errorMsg.style.fontSize = '0.9em';
    errorMsg.className = 'error-message';

    let input;
    if (field.type === 'radio') {
      const fragment = document.createDocumentFragment();
      field.options.forEach(opt => {
        const radioWrapper = document.createElement('label');
        radioWrapper.className = 'radio-wrapper';


        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = field.name;
        radio.value = opt.value;
        radio.required = field.required;

        radio.addEventListener('change', () => {
          updateVisibility();
          checkFormValidity();
        });

        radioWrapper.appendChild(radio);
        radioWrapper.append(' ' + opt.label);
        fragment.appendChild(radioWrapper);
      });

      wrapper.appendChild(label);
      wrapper.appendChild(fragment);

      // ✅ Only assign after radios are in DOM
      setTimeout(() => {
        inputElements[field.name] = form.querySelectorAll(`input[name="${field.name}"]`);
      });
    }
    else {
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
      } else {
        input = document.createElement('input');
        input.type = field.type;
      }
      input.name = field.name;
      if (field.required) input.required = true;
      if (field.type === 'file') input.multiple = true;

      inputElements[field.name] = input;

      const validateField = () => {
        const val = input.value;
        let error = '';
        const visible = wrapper.style.display !== 'none';

        if (field.required && visible) {
          if (!val || (field.type === 'file' && input.files.length === 0)) {
            error = `Pole ${field.label} je povinné.`;
          } else if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) error = 'Zadejte prosím platnou e-mailovou adresu.';
          }
        }

        if (field.type === 'file' && visible) {
          let totalSize = 0;
          for (const file of input.files) {
            totalSize += file.size;
          }
          if (totalSize > MAX_FILE_SIZE) {
            error = 'Celková velikost všech souborů přesahuje 10MB.';
          }
        }

        errorMsg.textContent = error;
        checkFormValidity();
      };

      input.addEventListener(field.type === 'file' ? 'change' : 'input', validateField);

      label.appendChild(document.createElement('br'));
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      wrapper.appendChild(errorMsg);
    }

    form.appendChild(wrapper);
  });

  const note = document.createElement('p');
  note.textContent = 'Položky označené hvězdičkou jsou povinné.';
  form.appendChild(note);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.disabled = true;
  submitBtn.style.backgroundColor = '#ccc';
  submitBtn.style.cursor = 'not-allowed';
  submitBtn.style.position = 'relative';

  const textSpan = document.createElement('span');
  textSpan.textContent = 'Odeslat';
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
  spinner.style.display = 'none';
  submitBtn.appendChild(spinner);

  form.appendChild(submitBtn);
  container.appendChild(form);
  container.appendChild(errorsDiv);
  container.appendChild(successDiv);

  updateVisibility();


  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorsDiv.textContent = '';
    successDiv.textContent = '';

    if (submitBtn.disabled) {
      errorsDiv.textContent = 'Formulář není vyplněn správně.';
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
        updateVisibility();
        checkFormValidity();
      } else {
        errorsDiv.textContent = result.message || 'Neznámá chyba.';
        console.error('Chyba při odesílání e-mailu:', result.error);
      }
    } catch (err) {
      errorsDiv.textContent = 'Chyba sítě nebo serveru: ' + err.message;
    } finally {
      spinner.style.display = 'none';
      textSpan.style.visibility = 'visible';
      checkFormValidity();
    }
  });
}

loadForm()