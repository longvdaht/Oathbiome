document.addEventListener('DOMContentLoaded', function () {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector('.section-scroll-reveal:not(.is-static)');
  const contentWrapper = section?.querySelector('.scroll-reveal__content__wrapper');
  const lines = section ? Array.from(section.querySelectorAll('.scroll-reveal-line')) : [];

  if (!section || !lines.length) return;
  
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom top',
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: function (self) {
      if (self.progress > 0) {
        contentWrapper.classList.remove('hide');
      } else {
        contentWrapper.classList.add('hide');
      }
      const index = Math.min(
        lines.length - 1,
        Math.floor(self.progress * lines.length)
      );
      setActiveLine(index);
    }
  });

  function setActiveLine(activeIndex) {
    lines.forEach(function (line, i) {
      if (i === activeIndex) {
        line.classList.remove('hide');
        line.classList.add('show');
      } else {
        line.classList.remove('show');
        line.classList.add('hide');
      }
    });
  }

  setActiveLine(0);

  let resizeTimeout;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
  });
  ro.observe(document.body);
});