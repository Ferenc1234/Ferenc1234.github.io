// Načte definici formuláře ze serveru a vykreslí ho dynamicky
async function loadForm() {
  // Načtení polí formuláře ze serveru (GET)
  const res = await fetch('https://hidden-term-c0fc.frubacek.workers.dev/');
  const fields = await res.json();

  // Kontejner, kam se formulář vykreslí
  const container = document.getElementById('form-container');
  const form = document.createElement('form');
  form.id = 'dynamic-form';
  form.noValidate = true; // zakázat výchozí HTML5 validaci

  // Elementy pro zobrazení chyb nebo úspěšné zprávy
  const errorsDiv = document.createElement('div');
  errorsDiv.style.color = 'red';
  errorsDiv.style.marginTop = '1rem';

  const successDiv = document.createElement('div');
  successDiv.style.color = 'lightgreen';
  successDiv.style.marginTop = '1rem';

  // Maximální velikost souboru (10 MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Objekt pro uchování vstupních prvků podle názvu
  const inputElements = {};

  // Funkce pro kontrolu validity formuláře (povolí/zakáže tlačítko)
  const checkFormValidity = () => {
    let isValid = true;

    fields.forEach(field => {
      const input = inputElements[field.name];
      const val = input.value;

      // Kontrola povinných polí
      if (field.required) {
        if (!val || (field.type === 'file' && input.files.length === 0)) {
          isValid = false;
        } else if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) isValid = false;
        }
      }

      // Kontrola velikosti souboru
      if (field.type === 'file') {
        const file = input.files[0];
        if (file && file.size > MAX_FILE_SIZE) {
          isValid = false;
        }
      }
    });

    // Aktivace nebo deaktivace tlačítka odeslání
    if (isValid) {
      submitBtn.disabled = false;
      submitBtn.style.backgroundColor = '';
      submitBtn.style.cursor = 'pointer';
    } else {
      submitBtn.disabled = true;
      submitBtn.style.backgroundColor = '#ccc';
      submitBtn.style.cursor = 'not-allowed';
      errorsDiv.textContent = 'Prosím opravte chyby výše před odesláním.';
    }

    return isValid;
  };

  // Vykreslení jednotlivých polí formuláře
  fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '1rem';

    const label = document.createElement('label');
    label.innerHTML = field.label + (field.required ? ' <span style="color:red">*</span>' : '') + ':';

    // Vytvoření vstupu nebo textového pole
    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
    } else {
      input = document.createElement('input');
      input.type = field.type;
    }

    input.name = field.name;
    if (field.required) input.required = true;
    inputElements[field.name] = input;

    // Element pro chybové hlášení u jednotlivých polí
    const errorMsg = document.createElement('div');
    errorMsg.style.color = 'red';
    errorMsg.style.fontSize = '0.9em';
    errorMsg.className = 'error-message';

    // Validace jednoho pole
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
      checkFormValidity();
      return error === '';
    };

    // Událost pro validaci při změně
    input.addEventListener(field.type === 'file' ? 'change' : 'input', validateField);

    label.appendChild(document.createElement('br'));
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(errorMsg);
    form.appendChild(wrapper);
  });

  // Tlačítko odeslání
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.disabled = true;
  submitBtn.style.backgroundColor = '#ccc';
  submitBtn.style.cursor = 'not-allowed';
  submitBtn.style.position = 'relative';

  // Poznámka pod formulářem
  const note = document.createElement('p');
  note.textContent = 'Položky označené hvězdičkou jsou povinné.';
  form.appendChild(note);

  // Text na tlačítku
  const textSpan = document.createElement('span');
  textSpan.textContent = 'Odeslat';
  textSpan.style.visibility = 'visible';
  submitBtn.appendChild(textSpan);

  // Spinner indikující odesílání
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
  spinner.style.transform = 'translate(-100%, -100%)';
  spinner.style.display = 'none';
  submitBtn.appendChild(spinner);

  form.appendChild(submitBtn);
  container.appendChild(form);
  container.appendChild(errorsDiv);
  container.appendChild(successDiv);

  // Událost pro odeslání formuláře
  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorsDiv.textContent = '';
    successDiv.textContent = '';

    if (submitBtn.disabled) {
      errorsDiv.textContent = 'Formulář není vyplněn správně.';
      return;
    }

    // Dodatečná kontrola chyb
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

    // Zobrazit spinner a deaktivovat tlačítko
    spinner.style.display = 'inline-block';
    textSpan.style.visibility = 'hidden';
    submitBtn.disabled = true;

    try {
      // reCAPTCHA token
      const token = await grecaptcha.execute('6LeNLFQrAAAAAE1PT3plAyvknxmEemxdQv0KrPFS', { action: 'submit' });
      formData.append('captcha', token);

      // Odeslání dat na server (POST)
      const res = await fetch('https://hidden-term-c0fc.frubacek.workers.dev/', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        // Úspěch
        successDiv.textContent = result.message;
        form.reset();
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        checkFormValidity();
      } else {
        // Server vrátil chybu
        errorsDiv.textContent = result.message || 'Neznámá chyba.';
        console.error('Chyba při odesílání e-mailu:', result.error);
      }
    } catch (err) {
      // Síťová chyba
      errorsDiv.textContent = 'Chyba sítě nebo serveru: ' + err.message;
    } finally {
      // Obnovení tlačítka
      spinner.style.display = 'none';
      textSpan.style.visibility = 'visible';
      checkFormValidity();
    }
  });
}

// Spuštění funkce po načtení stránky
loadForm();
