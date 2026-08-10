document.addEventListener('DOMContentLoaded', () => {
  const containerSlides = document.querySelector('  product-images .product__slides');
  if (!containerSlides) return;

  const screenWidth = window.innerWidth;
  if (screenWidth < 750 ) {
    const flkty = new window.theme.Flickity(containerSlides, {
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

    setTimeout(() => {
      flkty.resize();
    }, 100);
  }
});