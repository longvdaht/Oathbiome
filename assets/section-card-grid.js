document.addEventListener('DOMContentLoaded', function () {
  const toggleButtons = document.querySelectorAll('[data-toggle]');

  toggleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('[data-goal-card]');
      card.classList.toggle('active');
    });
  });
});
