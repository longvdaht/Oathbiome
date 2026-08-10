document.addEventListener('DOMContentLoaded', function () {
  const sections = document.querySelectorAll('.section-easy-use');

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  sections.forEach(section => {
    const items = section.querySelectorAll('.item');

    items.forEach(item => {
      const video = item.querySelector('video.has-video');
      if (!video) return;

      item.style.cursor = 'pointer';
      video.muted = true;
      video.playsInline = true;

      if (isTouchDevice) {
        video.load();
        video.play();
      } else {
        item.addEventListener('mouseenter', () => video.play());
        item.addEventListener('mouseleave', () => video.pause());
      }
    });
  });
});
