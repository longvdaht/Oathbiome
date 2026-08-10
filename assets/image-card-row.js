/**
 * Image Card Row Slider Component
 * Handles initialization and management of Swiper sliders for image card rows
 */

class ImageCardRowSlider {
  constructor() {
    this.sliders = [];
    this.swiperLoaded = false;
    this.initRetryCount = 0;
    this.maxRetries = 5;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.waitForSwiperAndInit();
      });
    } else {
      this.waitForSwiperAndInit();
    }
  }

  waitForSwiperAndInit() {
    // Check if Swiper is available
    if (window.Swiper) {
      this.swiperLoaded = true;
      this.initSliders();
      return;
    }

    // If Swiper is not available, wait and retry
    if (this.initRetryCount < this.maxRetries) {
      this.initRetryCount++;
      setTimeout(() => {
        this.waitForSwiperAndInit();
      }, 200 * this.initRetryCount); // Increasing delay, longer waits
    } else {
      // Fallback: try to initialize without Swiper for graceful degradation
      this.initFallback();
    }
  }

  initFallback() {
    // Graceful degradation - show slides without Swiper functionality
    const sliderElements = document.querySelectorAll('.image-card-row-slider[data-swiper]');
    sliderElements.forEach(slider => {
      slider.classList.add('swiper-fallback');
    });
  }

  setupEventListeners() {
    // Re-initialize when sections are loaded/reloaded (for theme editor)
    document.addEventListener('shopify:section:load', (event) => {
      if (event.target.querySelector('.image-card-row-slider')) {
        setTimeout(() => {
          this.waitForSwiperAndInit();
        }, 100);
      }
    });

    // Clean up when sections are unloaded
    document.addEventListener('shopify:section:unload', (event) => {
      this.destroySliders(event.target);
    });

    // Handle theme editor block selection
    document.addEventListener('shopify:block:select', (event) => {
      if (event.target.closest('.image-card-row-slider')) {
        const slider = event.target.closest('.image-card-row-slider');
        const instance = this.getSliderInstance(slider);
        if (instance) {
          const blockIndex = Array.from(slider.querySelectorAll('.swiper-slide')).indexOf(event.target.closest('.swiper-slide'));
          if (blockIndex !== -1) {
            instance.slideTo(blockIndex);
          }
        }
      }
    });
  }

  initSliders() {
    // Set up event listeners only once
    if (!this.eventListenersSetup) {
      this.setupEventListeners();
      this.eventListenersSetup = true;
    }
    const sliderElements = document.querySelectorAll('.image-card-row-slider[data-swiper]');
    
    sliderElements.forEach((sliderElement, index) => {
      if (!sliderElement.classList.contains('swiper-initialized')) {
        this.initSingleSlider(sliderElement);
      }
    });
  }

  getInitialOffset = () => {
    if (window.innerWidth >= 900) {
        const vw = window.innerWidth / 100;
        return 8.1 * vw + 31;
    }
    return 0;
};

  initSingleSlider(sliderElement) {
    try {
      // Parse the data-swiper options
      const options = JSON.parse(sliderElement.getAttribute('data-swiper'));
      
      // Enhanced options for better UX
      const enhancedOptions = {
        slidesPerView: 'auto',
        spaceBetween: 6,
        centeredSlides: false,
        loop: false,
        watchSlidesProgress: true,
        watchOverflow: true,
        resistance: true,
        resistanceRatio: 0.85,
        speed: 400,
        ...options,
        // Navigation configuration
        navigation: options.navigation ? {
          nextEl: sliderElement.querySelector('.swiper-button-next'),
          prevEl: sliderElement.querySelector('.swiper-button-prev'),
        } : false,
        // Pagination configuration
        pagination: options.pagination ? {
          el: sliderElement.querySelector('.swiper-pagination'),
          clickable: true,
          type: 'bullets',
        } : false,
        // Responsive breakpoints
        breakpoints: {
          320: {
            slidesPerView: 1.1,
            spaceBetween: 6,
            centeredSlides: false,
          },
          900: {
            slidesPerView: 2.4,
            spaceBetween: 6,
            centeredSlides: false,
            slidesOffsetBefore: this.getInitialOffset()
          }
        }
      };

      // Check if Swiper is available
      if (window.Swiper) {
        const swiperInstance = new window.Swiper(sliderElement, enhancedOptions);
        
        // Store reference for cleanup
        this.sliders.push({
          element: sliderElement,
          instance: swiperInstance
        });

        // Add custom event listeners
        this.addEventListeners(sliderElement, swiperInstance);
        
        // Trigger custom event for other scripts
        sliderElement.dispatchEvent(new CustomEvent('imageCardRow:initialized', {
          detail: { swiper: swiperInstance }
        }));

      } else {
        console.warn('Swiper not available. Make sure Swiper library is loaded.');
      }
    } catch (error) {
      console.error('Error initializing image card row slider:', error);
    }
  }

  addEventListeners(sliderElement, swiperInstance) {
    // Handle slide change
    swiperInstance.on('slideChange', () => {
      sliderElement.dispatchEvent(new CustomEvent('imageCardRow:change', {
        detail: { 
          index: swiperInstance.activeIndex, 
          swiper: swiperInstance 
        }
      }));
    });

    // Handle resize with improved logic
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (swiperInstance && !swiperInstance.destroyed) {
          swiperInstance.update();
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Store resize handler for cleanup
    sliderElement._resizeHandler = handleResize;

    // Handle touch events for better mobile experience
    swiperInstance.on('touchStart', () => {
      sliderElement.classList.add('swiping');
    });

    swiperInstance.on('touchEnd', () => {
      sliderElement.classList.remove('swiping');
    });

    // Handle progress for custom styling
    swiperInstance.on('progress', (progress) => {
      sliderElement.style.setProperty('--swiper-progress', progress);
    });
  }

  destroySliders(container = document) {
    const slidersToDestroy = this.sliders.filter(slider => 
      container.contains(slider.element)
    );

    slidersToDestroy.forEach(({ element, instance }) => {
      // Remove resize handler
      if (element._resizeHandler) {
        window.removeEventListener('resize', element._resizeHandler);
        delete element._resizeHandler;
      }

      // Destroy swiper instance
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy(true, true);
      }

      // Remove from our tracking array
      const index = this.sliders.findIndex(slider => slider.element === element);
      if (index > -1) {
        this.sliders.splice(index, 1);
      }
    });
  }

  // Public method to get swiper instance for a specific element
  getSliderInstance(element) {
    const slider = this.sliders.find(slider => slider.element === element);
    return slider ? slider.instance : null;
  }

  // Public method to refresh all sliders
  refreshSliders() {
    this.sliders.forEach(({ instance }) => {
      if (instance && typeof instance.update === 'function') {
        instance.update();
      }
    });
  }

  // Public method to go to specific slide
  goToSlide(element, index) {
    const instance = this.getSliderInstance(element);
    if (instance) {
      instance.slideTo(index);
    }
  }

  // Public method to go to next slide
  nextSlide(element) {
    const instance = this.getSliderInstance(element);
    if (instance) {
      instance.slideNext();
    }
  }

  // Public method to go to previous slide
  prevSlide(element) {
    const instance = this.getSliderInstance(element);
    if (instance) {
      instance.slidePrev();
    }
  }
}

// Initialize the slider manager
const imageCardRowSlider = new ImageCardRowSlider();

// Expose to global scope for external access if needed
window.imageCardRowSlider = imageCardRowSlider;
