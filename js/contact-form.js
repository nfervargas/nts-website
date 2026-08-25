/**
 * Validación en tiempo real y envío por fetch() del formulario de contacto,
 * sin salir de la página. Incluye honeypot anti-spam.
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    var statusBox = form.querySelector('.form-status');

    var validators = {
      nombre: function (value) {
        return value.trim().length >= 3 ? '' : 'Ingresa tu nombre completo (mínimo 3 caracteres).';
      },
      email: function (value) {
        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(value.trim()) ? '' : 'Ingresa un correo electrónico válido.';
      },
      telefono: function (value) {
        if (!value.trim()) return '';
        var pattern = /^[0-9+\s()-]{7,20}$/;
        return pattern.test(value.trim()) ? '' : 'Ingresa un teléfono válido.';
      },
      mensaje: function (value) {
        return value.trim().length >= 10 ? '' : 'Cuéntanos brevemente qué necesitas (mínimo 10 caracteres).';
      },
      privacidad: function (value, field) {
        return field.checked ? '' : 'Debes aceptar la política de tratamiento de datos.';
      }
    };

    function fieldWrapper(field) {
      return field.closest('.form-field') || field.parentElement;
    }

    function showError(field, message) {
      var wrapper = fieldWrapper(field);
      var errorEl = wrapper.querySelector('.field-error');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        wrapper.appendChild(errorEl);
      }
      errorEl.textContent = message;
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateField(field) {
      var validator = validators[field.name];
      if (!validator) return true;
      var value = field.type === 'checkbox' ? field.checked : field.value;
      var message = validator(value, field);
      showError(field, message);
      return !message;
    }

    Object.keys(validators).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      var eventType = field.type === 'checkbox' ? 'change' : 'blur';
      field.addEventListener(eventType, function () {
        validateField(field);
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // Honeypot: si este campo oculto viene lleno, es un bot.
      var honeypot = form.elements['sitio_web'];
      if (honeypot && honeypot.value) {
        return;
      }

      var isValid = true;
      Object.keys(validators).forEach(function (name) {
        var field = form.elements[name];
        if (!field) return;
        if (!validateField(field)) isValid = false;
      });

      if (!isValid) {
        if (statusBox) {
          statusBox.textContent = 'Por favor corrige los campos marcados en rojo.';
          statusBox.className = 'form-status form-status--error';
        }
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (statusBox) {
        statusBox.textContent = 'Enviando tu mensaje...';
        statusBox.className = 'form-status form-status--pending';
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            if (statusBox) {
              statusBox.textContent = '¡Gracias! Tu mensaje fue enviado. Un asesor de NTS te contactará pronto.';
              statusBox.className = 'form-status form-status--success';
            }
            form.reset();
            if (window.gtag) {
              window.gtag('event', 'generate_lead', { method: 'formulario_contacto' });
            }
          } else {
            throw new Error('Respuesta no exitosa');
          }
        })
        .catch(function () {
          if (statusBox) {
            statusBox.textContent =
              'No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por WhatsApp.';
            statusBox.className = 'form-status form-status--error';
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  });
})();
