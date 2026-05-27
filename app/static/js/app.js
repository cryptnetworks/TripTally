document.addEventListener('DOMContentLoaded', function () {
  const selects = document.querySelectorAll('select[multiple]');
  selects.forEach(select => {
    if (select.options.length > 0) {
      select.size = Math.min(select.options.length, 5);
    }
  });

  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    window.setTimeout(() => {
      alert.classList.remove('show');
      alert.classList.add('fade');
    }, 5000);
  });

  const confirmButtons = document.querySelectorAll('[data-confirm]');
  confirmButtons.forEach(button => {
    button.addEventListener('click', function (event) {
      const message = this.getAttribute('data-confirm');
      if (!confirm(message)) {
        event.preventDefault();
      }
    });
  });
});
