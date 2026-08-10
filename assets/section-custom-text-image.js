document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('.custom-text-image-section');
  if (!containers.length) return;

  containers.forEach(section => {
    const container = section.querySelector('.custom-image__container');
    const buttons = section.querySelectorAll('.custom-text-image__button');
    const sliderItem = container.querySelectorAll('.custom-text-image__item');
    
    if (sliderItem.length >= 2) {
      const flkty = new window.theme.Flickity(container, {
        cellAlign: 'center',
        contain: true,
        wrapAround: true,
        pageDots: false,
        prevNextButtons: false,
        draggable: false,
        freeScroll: false,
        groupCells: false,
        initialIndex: 0,
        autoPlay: false,
        adaptiveHeight: false,
        percentPosition: true,
      });

      setTimeout(() => {
        flkty.resize();
      }, 10);

      const updateSelectedButton = (index) => {
        buttons.forEach(btn => btn.classList.remove('is-selected'));
        if (buttons[index]) {
          buttons[index].classList.add('is-selected');
        }
      };

      updateSelectedButton(flkty.selectedIndex);

      flkty.on('change', (index) => {
        updateSelectedButton(index);
      });

      buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
          flkty.select(index, false, true);

          const img = sliderItem[index].querySelector('img');
          const video = sliderItem[index].querySelector('video');

          if (img && img.src.includes('.gif')) {
            const src = img.src;
            img.src = '';
            img.offsetHeight;
            img.src = src;
          } else if (video && video.src.includes('.mp4') || video.src.includes('.m3u8')) {
            video.load();
            video.play();
          }
        });
      });
    }
  });
});
