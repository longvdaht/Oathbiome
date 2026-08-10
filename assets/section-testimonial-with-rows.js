document.addEventListener('DOMContentLoaded', function () {
  const testimonialSections = document.querySelectorAll('.testimonial-with-rows');

  if (testimonialSections.length === 0) return;

  function equalizeTestimonialHeights(container) {
    const items = container.querySelectorAll('.testimonial-main-mb .testimonial-item');
    let maxHeight = 0;

    items.forEach((item) => {
      item.style.height = 'auto';
      maxHeight = Math.max(maxHeight, item.offsetHeight);
    });

    items.forEach((item) => {
      item.style.height = `${maxHeight}px`;
    });
  }

  testimonialSections.forEach((section) => {
    const container = section.querySelector('.testimonial-main-mb');
    const testimonialItems = container.querySelectorAll('.testimonial-main-mb .testimonial-item');

    if (testimonialItems.length < 2) return;

    container.classList.remove('only-block');

    const showButtons = container.getAttribute('data-show-buttons') !== 'false';
    const autoPlay = container.getAttribute('data-autoplay') !== 'false';
    const autoPlaySpeed = parseInt(container.getAttribute('data-autoplay-speed')) || 3000;

    const flkty = new window.theme.Flickity(container, {
      cellAlign: 'left',
      contain: true,
      wrapAround: true,
      pageDots: false,
      prevNextButtons: false,
      draggable: true,
      freeScroll: false,
      groupCells: false,
      initialIndex: 0,
      autoPlay: false,
      adaptiveHeight: true,
      percentPosition: true,
    });

    const updateLayout = () => {
      equalizeTestimonialHeights(container);
      flkty.resize();
      flkty.select(flkty.selectedIndex, false, true);
    };

    setTimeout(updateLayout, 100);

    window.addEventListener('resize', window.debounce(updateLayout, 150));
  });
});
