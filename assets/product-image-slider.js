document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('.soil-slider');
  if (!containers.length) return;

  containers.forEach(section => {
    const container = section.querySelector('.soil-slider__container');
    const sliderItems = container.querySelectorAll('.slide-item');
    const screenWidth = window.innerWidth;

    // Luôn khởi động flickity nếu có ít nhất 1 block
    if (sliderItems.length >= 1) {
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
        initialIndex: 2,
        autoPlay: false,
        adaptiveHeight: false,
        percentPosition: true,
      });

      const prevButton = section.querySelector('.custom-prev');
      const nextButton = section.querySelector('.custom-next');

      if (prevButton) {
        prevButton.addEventListener('click', () => flkty.previous());
      }

      if (nextButton) {
        nextButton.addEventListener('click', () => flkty.next());
      }

      setTimeout(() => {
        flkty.resize();
      }, 100);
    }
  });
});
