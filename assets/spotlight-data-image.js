document.addEventListener("DOMContentLoaded", function () {
  const flickityEls = document.querySelectorAll(".flickity-carousel");

  flickityEls.forEach((carouselEl) => {
    const cellCount = carouselEl.querySelectorAll(".carousel-cell").length;

    const flkty = new Flickity(carouselEl, {
      cellAlign: cellCount >= 3 ? "center" : "left",
      contain: true,
      prevNextButtons: cellCount >= 2,
      pageDots: true,
      groupCells: false,
      wrapAround: cellCount >= 3, 
      selectedAttraction: 0.01,
      friction: 0.15
    });

    if (cellCount === 2) {
      carouselEl.classList.add("align-right");
    }
  });
});
