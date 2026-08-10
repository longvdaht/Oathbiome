document.addEventListener("DOMContentLoaded", function () {
  const mainCarousel = document.querySelector(".carousel-main");
  const lightbox = document.querySelector(".lightbox-overlay");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxCarouselEl = document.querySelector(".lightbox-carousel");

  let flickityInstance = null;
  let flktyLightbox = null;

  function isMobileView() {
    return window.innerWidth <= 989;
  }

  function initMobileFlickity() {
    if (isMobileView() && !flickityInstance) {
      const cells = mainCarousel.querySelectorAll(".carousel-cell");
      cells.forEach(cell => {
        cell.style.width = '90%';
      });

      flickityInstance = new Flickity(mainCarousel, {
        cellAlign: "left",
        contain: true,
        pageDots: true,
        prevNextButtons: false,
        wrapAround: true,
        groupCells: false,
        freeScroll: false,
        percentPosition: true,
      });
    }
  }

  // Initial init on load
  initMobileFlickity();

  // Re-init Flickity on resize
  window.addEventListener("resize", () => {
    const isMobile = isMobileView();

    // Init Flickity if entering mobile
    if (isMobile && !flickityInstance) {
      initMobileFlickity();
    }

    // Destroy Flickity if entering desktop
    if (!isMobile && flickityInstance) {
      flickityInstance.destroy();
      flickityInstance = null;
    }

    // Resize lightbox Flickity if open
    if (flktyLightbox && lightbox.classList.contains("is-visible")) {
      setTimeout(() => {
        flktyLightbox.resize();
      }, 100);
    }
  });

  // Setup Lightbox
  const images = document.querySelectorAll(".carousel-main img");
  images.forEach((img) => {
    img.addEventListener("click", function () {
      const index = parseInt(img.dataset.index, 10);
       console.log("Opening lightbox at index:", index);
      lightbox.classList.add("is-visible");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (flktyLightbox) {
            flktyLightbox.select(index);
            flktyLightbox.resize();
          } else {
            flktyLightbox = new Flickity(lightboxCarouselEl, {
              cellAlign: "center",
              contain: true,
              pageDots: false,
              prevNextButtons: true,
              wrapAround: false,
              initialIndex: index,
              draggable: true,
            });
          }
        });
      });
    });
  });

  // Close Lightbox
  lightboxClose.addEventListener("click", () => {
    lightbox.classList.remove("is-visible");
  });
});
