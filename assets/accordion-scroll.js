(function () {
  window.addEventListener("load", function () {
    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    gsap.registerPlugin(ScrollTrigger);
    const accEls = gsap.utils.toArray(".accordion")
      , headerEl = document.querySelector(".theme__header")
      , headerHeight = headerEl ? headerEl.offsetHeight : 0
      , spacer = document.querySelector(".spacer-after-scroll");
    accEls.forEach((accEl, index) => {
      if (accEls.length - 1 == index) return;
      const collapseAmount = accEl.offsetHeight;
      ScrollTrigger.create({
          trigger: accEl,
          start: "top top",
          end: "bottom+=50px top",
          pin: true,
          pinSpacing: !1,
          scrub: !0,
          anticipatePin: 1,
          invalidateOnRefresh: !0,
      });
      const contentWrapper = accEl.querySelector(".content-wrapper");
      contentWrapper && gsap.to(contentWrapper, {
          y: -200,
          force3D: !0,
          ease: "none",
          scrollTrigger: {
            markers: false,
            trigger: accEl,
            start: "top top",
            end: "bottom+=200px top",
            scrub: !0
          }
      })
    });
  })
}
)();