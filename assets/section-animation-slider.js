document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.section-animation__container');
  const dotContainer = document.querySelector('.section-number__container');
  const introSlideOriginal = container.querySelector('.section-animation__item--intro');
  const introHTML = introSlideOriginal ? introSlideOriginal.outerHTML : '';

  let flkty = null;
  let isMobile = window.matchMedia('(max-width: 750px)').matches;
  let slides = [];

  function buildSlider() {
    if (flkty) {
      flkty.destroy();
      flkty = null;
    }

    isMobile = window.matchMedia('(max-width: 750px)').matches;

    if (!container.querySelector('.section-animation__item--intro') && introHTML) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = introHTML.trim();
      container.insertBefore(wrapper.firstElementChild, container.firstChild);
    }

    slides = Array.from(container.querySelectorAll('.section-animation__item'));
    const hasIntro = !!container.querySelector('.section-animation__item--intro');
    const dots = document.querySelectorAll('.section-dots');
    const regularSlides = slides.filter(slide =>
      slide.classList.contains('section-animation__item--slide')
    );

    flkty = new window.theme.Flickity(container, {
      cellAlign: 'left',
      contain: true,
      pageDots: false,
      prevNextButtons: false,
      wrapAround: false,
      draggable: isMobile ? true : false,
      initialIndex: 0,
      dragThreshold: 30,
    });

    function playVideoInSlide(index) {
      slides.forEach(slide => {
        const video = slide.querySelector('video');
        if (!video) return;

        const isIntro = slide.classList.contains('section-animation__item--intro');

        if (slide === slides[index]) {
          if (isIntro) return;
          if (!video.dataset.userPaused) {
            video.currentTime = 0;
            video.play();
          }
        } else {
          video.pause();
          delete video.dataset.userPaused;
        }
      });
    }

    function updateDots(activeIndex) {
      const activeSlide = slides[activeIndex];
      const isIntro = activeSlide.classList.contains('section-animation__item--intro');

      dots.forEach((dot, i) => {
        const targetSlide = regularSlides[i];
        dot.classList.toggle('active', activeSlide === targetSlide);
      });

      if (dotContainer) {
        if (hasIntro) {
          dotContainer.classList.toggle('hidden', isIntro);
        } else {
          dotContainer.classList.remove('hidden');
        }
      }
    }

    playVideoInSlide(flkty.selectedIndex);
    updateDots(flkty.selectedIndex);

    flkty.on('change', index => {
      playVideoInSlide(index);
      updateDots(index);
    });

    slides.forEach(slide => {
      const video = slide.querySelector('video');
      const playIcon = slide.querySelector('.section-animation__regular-icon');
      if (!video) return;

      const isIntro = slide.classList.contains('section-animation__item--intro');

      if (isIntro && !isMobile) {
        const wrapper = video.parentElement;
        wrapper.addEventListener('mouseenter', () => {
          video.currentTime = 0;
          video.play();
        });
        wrapper.addEventListener('mouseleave', () => {
          video.pause();
          video.currentTime = 0;
        });
      }

      playIcon?.addEventListener('click', () => {
        video.play();
        playIcon.classList.add('icon-hidden');
      });

      video.addEventListener('click', () => {
        if (isIntro && !isMobile) return;

        if (video.ended) video.currentTime = 0;

        if (video.paused) {
          video.play();
          delete video.dataset.userPaused;
          if (playIcon) playIcon.classList.add('icon-hidden');
        } else {
          video.pause();
          video.dataset.userPaused = true;
          if (playIcon) playIcon.classList.remove('icon-hidden');
        }
      });

      video.addEventListener('ended', () => {
        if (video.dataset.userPaused) return;

        const currentIndex = slides.indexOf(slide);
        const nextIndex = currentIndex + 1;

        if (nextIndex < slides.length) {
          flkty.select(nextIndex);
        } else {
          const introIndex = slides.findIndex(s => s.classList.contains('section-animation__item--intro'));
          if (introIndex !== -1) {
            flkty.select(introIndex);
          } else {
            const firstRegular = slides.find(s => s.classList.contains('section-animation__item--slide'));
            if (firstRegular) {
              flkty.select(slides.indexOf(firstRegular));
            }
          }
        }
        updateDots(flkty.selectedIndex);
      });
    });

    const introSlide = slides.find(s => s.classList.contains('section-animation__item--intro'));
    const playButton = introSlide?.querySelector('.section-animation__first-icon');
    if (playButton) {
      playButton.addEventListener('click', () => {
        const firstRegular = slides.find(s => s.classList.contains('section-animation__item--slide'));
        if (firstRegular) {
          flkty.select(slides.indexOf(firstRegular));
          updateDots(flkty.selectedIndex);
        }
      });
    }

    dots.forEach((dot, i) => {
      dot.dataset.index = i;
      dot.addEventListener('click', () => {
        const targetSlide = regularSlides[i];
        const realIndex = slides.indexOf(targetSlide);
        if (realIndex !== -1) {
          flkty.select(realIndex, false, true);
        }
      });
    });


    if (isMobile) {
      const btnNext = dotContainer.querySelector('.next-slide');
      const btnPrev = dotContainer.querySelector('.prev-slide');
      const counter = dotContainer.querySelector('.mobile-indicator');
      const currentEl = counter?.querySelector('.slider-current');
      const totalEl = counter?.querySelector('.slider-total');

      if (currentEl && totalEl) {
        totalEl.textContent = regularSlides.length;
        const activeSlide = slides[flkty.selectedIndex];
        currentEl.textContent = activeSlide.classList.contains('section-animation__item--slide')
          ? regularSlides.indexOf(activeSlide) + 1
          : 1;
      }

      flkty.on('change', index => {
        const activeSlide = slides[index];
        if (currentEl) {
          currentEl.textContent = activeSlide.classList.contains('section-animation__item--slide')
            ? regularSlides.indexOf(activeSlide) + 1
            : 1;
        }
      });

      if (btnNext) {
        btnNext.addEventListener('click', () => {
          if (flkty.selectedIndex < slides.length - 1) {
            flkty.next();
          }
        });
      }

      if (btnPrev) {
        btnPrev.addEventListener('click', () => {
          const currentSlide = slides[flkty.selectedIndex];
          if (currentSlide.classList.contains('section-animation__item--slide')) {
            const idx = regularSlides.indexOf(currentSlide);
            if (idx > 0) {
              const prevSlide = regularSlides[idx - 1];
              flkty.select(slides.indexOf(prevSlide));
            }
          }
        });
      }
    }
  }

  buildSlider();

  window.addEventListener('resize', () => {
    window.theme.debounce(() => buildSlider(), 300);
  });
});
