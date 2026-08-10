document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('.video-slider');
  if (!containers.length) return;

  let flktyInstances = [];

  function initSliders() {
    containers.forEach((section, index) => {
      const container = section.querySelector('.video-slider__container');
      const sliderItems = container.querySelectorAll('.video-slider__item');
      const screenWidth = window.innerWidth;

      if (flktyInstances[index]) {
        flktyInstances[index].destroy();
        flktyInstances[index] = null;
        container.classList.add('normal-container');
      }

      if ((screenWidth < 750 && sliderItems.length > 1) || (screenWidth >= 750 && sliderItems.length > 3)) {
        container.classList.remove('normal-container');

        const flkty = new window.theme.Flickity(container, {
          cellAlign: 'center',
          contain: true,
          wrapAround: true,
          pageDots: false,
          prevNextButtons: false,
          draggable: true,
          freeScroll: false,
          groupCells: false,
          initialIndex: 0,
          autoPlay: false,
          adaptiveHeight: false,
          percentPosition: true,
        });

        const prevButton = section.querySelector('.custom-prev');
        const nextButton = section.querySelector('.custom-next');

        prevButton?.addEventListener('click', () => flkty.previous());
        nextButton?.addEventListener('click', () => flkty.next());

        setTimeout(() => {
          flkty.resize();
        }, 100);

        flktyInstances[index] = flkty;
      }
    });
  }

  initSliders();

  window.addEventListener('resize', window.debounce(initSliders, 200));
});
