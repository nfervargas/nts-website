/**
 * Menú desplegable "Servicios" accesible por mouse, teclado y táctil.
 * Reemplaza el patrón anterior (checkbox oculto + :hover), que no era
 * operable de forma confiable con el teclado.
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(function (dropdown) {
      var toggle = dropdown.querySelector('.dropdown-toggle');
      var content = dropdown.querySelector('.dropdown-content');
      if (!toggle || !content) return;

      function closeDropdown() {
        dropdown.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }

      function openDropdown() {
        dropdown.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }

      toggle.addEventListener('click', function (event) {
        event.preventDefault();
        var isOpen = dropdown.classList.contains('is-open');
        if (isOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      // Cerrar al perder el foco (Tab fuera del menú)
      dropdown.addEventListener('focusout', function (event) {
        if (!dropdown.contains(event.relatedTarget)) {
          closeDropdown();
        }
      });

      // Cerrar con Escape
      dropdown.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          closeDropdown();
          toggle.focus();
        }
      });

      // Cerrar al hacer clic fuera del menú
      document.addEventListener('click', function (event) {
        if (!dropdown.contains(event.target)) {
          closeDropdown();
        }
      });
    });
  });
})();
