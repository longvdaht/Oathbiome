document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".video-slider");
  if (!containers.length) return;

  containers.forEach((section) => {
    const container = section.querySelector(".video-slider__container");

    const flkty = new window.theme.Flickity(container, {
      cellAlign: "center",
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
  });
});
