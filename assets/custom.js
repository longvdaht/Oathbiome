/*
* Carbon Theme
*
* Use this file to add custom Javascript to Carbon.
* In order to use this file you will need to open layout/theme.liquid and add
* <script src="{{ 'custom.js' | asset_url }}" defer="defer"></script>
*/

(function() {
  // Add custom code below this line
  const iconMute = `<svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.15383 5.54749L9.51074 1.20194C9.60756 1.10549 9.73086 1.03983 9.86507 1.01323C9.99929 0.986642 10.1384 1.00032 10.2648 1.05253C10.3912 1.10474 10.4993 1.19315 10.5754 1.30659C10.6515 1.42003 10.6922 1.55341 10.6923 1.68989V16.3101C10.6922 16.4466 10.6515 16.58 10.5754 16.6934C10.4993 16.8069 10.3912 16.8953 10.2648 16.9475C10.1384 16.9997 9.99929 17.0134 9.86507 16.9868C9.73086 16.9602 9.60756 16.8945 9.51074 16.7981L5.15383 12.4525H3.08615C2.27384 12.4525 1.51323 11.9857 1.29723 11.2059C1.09924 10.4873 0.999265 9.74529 1 9C1 8.23585 1.10339 7.49655 1.29723 6.79408C1.51323 6.01335 2.27384 5.54749 3.08615 5.54749H5.15383Z" stroke="#FBFF36" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `

  const iconSound = `<svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16.5667 3.14087C17.3382 3.9103 17.9501 4.82374 18.3676 5.82906C18.7851 6.83437 19 7.91186 19 9C19 10.0881 18.7851 11.1656 18.3676 12.1709C17.9501 13.1763 17.3382 14.0897 16.5667 14.8591M14.1196 5.58248C15.0283 6.48891 15.5388 7.71821 15.5388 9C15.5388 10.2818 15.0283 11.5111 14.1196 12.4175M5.15383 5.54749L9.51074 1.20194C9.60756 1.10549 9.73086 1.03983 9.86507 1.01323C9.99929 0.986642 10.1384 1.00032 10.2648 1.05253C10.3912 1.10474 10.4993 1.19315 10.5754 1.30659C10.6515 1.42003 10.6922 1.55341 10.6923 1.68989V16.3101C10.6922 16.4466 10.6515 16.58 10.5754 16.6934C10.4993 16.8069 10.3912 16.8953 10.2648 16.9475C10.1384 16.9997 9.99929 17.0134 9.86507 16.9868C9.73086 16.9602 9.60756 16.8945 9.51074 16.7981L5.15383 12.4525H3.08615C2.27384 12.4525 1.51323 11.9857 1.29723 11.2059C1.09924 10.4873 0.999265 9.74529 1 9C1 8.23585 1.10339 7.49655 1.29723 6.79408C1.51323 6.01335 2.27384 5.54749 3.08615 5.54749H5.15383Z" stroke="#FBFF36" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `

  const iconFullscreen = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.48828 9.98291V13.5118C1.48828 14.6164 2.38371 15.5118 3.48828 15.5118H7.01757" stroke="#FBFF36" stroke-miterlimit="10" stroke-linecap="round"/>
    <path d="M7.01757 1H3.48828C2.38371 1 1.48828 1.89543 1.48828 3V6.52891" stroke="#FBFF36" stroke-miterlimit="10" stroke-linecap="round"/>
    <path d="M16 6.52891V3C16 1.89543 15.1046 1 14 1H10.4707" stroke="#FBFF36" stroke-miterlimit="10" stroke-linecap="round"/>
    <path d="M10.4707 15.5118H14C15.1046 15.5118 16 14.6164 16 13.5118V9.98291" stroke="#FBFF36" stroke-miterlimit="10" stroke-linecap="round"/>
    </svg>
  `
  document.addEventListener('DOMContentLoaded', function () {
    const banner = document.querySelector('.index-hero');
    
    if (banner) {
      document.body.classList.add('banner-page');
    } else {
      document.body.classList.remove('banner-page');
    }

    const container = document.querySelector('.drawer__empty__product');

    if (!container) return;

    const initSliderIfReady = () => {
      const items = container.querySelectorAll('quick-add-product');
      if (items.length > 1) {
        container.style.display = 'unset';
        new window.theme.Flickity(container, {
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
        observer.disconnect();
      }
    };

    const observer = new MutationObserver(() => {
      initSliderIfReady();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    initSliderIfReady();

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-video-type][data-video-src]');
      if (!trigger) return;
    
      const type = trigger.getAttribute('data-video-type');
      const encodedSrc = trigger.getAttribute('data-video-src');
    
      if (!type || !encodedSrc) return;
    
      const decodedSrc = atob(encodedSrc);
      openCustomVideoPopup({ type, src: decodedSrc });
    });
  });

  function isAppleDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
    const isMacOS = navigator.platform.indexOf('Mac') >= 0 && !isIOS;
  
    return isIOS || isMacOS;
  }
  
  function openCustomVideoPopup({ type, src }) {
    const popup = document.getElementById('custom-video-popup');
    const wrapper = popup.querySelector('.video-wrapper');
  
    if (!popup || !wrapper) return;
  
    document.body.classList.add('overflow-hidden');
    wrapper.innerHTML = '';

    const isHLS = src.includes('.m3u8');
  
    if (type === 'mp4') {
      const video = document.createElement('video');
      video.autoplay = true;
      video.controls = isAppleDevice();
      video.preload = 'metadata';
      video.style.width = '100%';
      video.style.height = '100%';
      video.id = 'popupVideo';
    
      wrapper.appendChild(video);
    
      if (isHLS) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else {
          console.error('HLS not supported');
          return;
        }
      } else {
        const source = document.createElement('source');
        source.src = src;
        source.type = 'video/mp4';
        video.appendChild(source);
      }
    
      if (!video.controls) {
        video.addEventListener('click', () => {
          video.paused ? video.play() : video.pause();
        });
    
        const controls = document.createElement('div');
        controls.className = 'custom-controls';
        controls.innerHTML = `
          <input type="range" id="seek-bar" value="0" step="0.01">
          <div class='control-tools'>
            <p id="time-display" class="body-small">0:00 / 0:00</p>
            <div class="control-btns">
              <button id="mute-btn" aria-label="Toggle Mute">
                ${iconSound}
              </button>
              <button id="fullscreen-btn" aria-label="Fullscreen">
                ${iconFullscreen}
              </button>
            </div>
          </div>
        `;
        wrapper.appendChild(controls);
        setupCustomControls(video);
      }
    
      popup.classList.remove('popup-hidden');
    } else if (type === 'youtube') {
      const youtubeId = getYoutubeId(src);
      if (!youtubeId) return;
      const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
      appendIframe(wrapper, embedUrl);
    } else if (type === 'vimeo') {
      const vimeoId = getVimeoId(src);
      if (!vimeoId) return;
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
      appendIframe(wrapper, embedUrl);

      //  setTimeout(() => {
      //   requestPopupFullscreen(popup);
      // }, 300);
       // const iframe = appendIframe(wrapper, embedUrl);
       //  const player = new Vimeo.Player(iframe);
      
       //  player.ready().then(() => {
       //    player.requestFullscreen().catch((err) => {
       //      console.warn('Vimeo fullscreen failed:', err);
       //    });
       //  });
    }
  
    popup.classList.remove('popup-hidden');
  }

  function appendIframe(wrapper, src) {
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allow = 'autoplay; fullscreen; encrypted-media';
    iframe.frameBorder = 0;
    iframe.allowFullscreen = true;
    iframe.width = '100%';
    iframe.height = '100%';
    wrapper.appendChild(iframe);
    // const iframe = document.createElement('iframe');
    // iframe.src = src;
    // iframe.setAttribute('frameborder', '0');
    // iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    // iframe.setAttribute('allowfullscreen', '');
    // iframe.style.width = '100%';
    // iframe.style.height = '100%';
    // wrapper.appendChild(iframe);
    // return iframe;
  }

  // function requestPopupFullscreen(el) {
  //   const target = el instanceof HTMLElement ? el : document.documentElement;
  
  //   if (target.requestFullscreen) {
  //     target.requestFullscreen().catch((err) => {
  //       console.warn('Fullscreen request failed', err);
  //     });
  //   } else if (target.webkitRequestFullscreen) {
  //     target.webkitRequestFullscreen();
  //   } else if (target.msRequestFullscreen) {
  //     target.msRequestFullscreen();
  //   }
  // }
  
  function closeCustomVideoPopup() {
    const popup = document.getElementById('custom-video-popup');
    const wrapper = popup.querySelector('.video-wrapper');
    if (wrapper) wrapper.innerHTML = '';
    document.body.classList.remove('overflow-hidden');
    popup.classList.add('popup-hidden');
  }
  
  // function appendIframe(wrapper, src) {
  //   const iframe = document.createElement('iframe');
  //   iframe.src = src;
  //   iframe.allow = 'autoplay; fullscreen; encrypted-media';
  //   iframe.frameBorder = 0;
  //   iframe.allowFullscreen = true;
  //   iframe.width = '100%';
  //   iframe.height = '100%';
  //   wrapper.appendChild(iframe);
  // }
  
  function getYoutubeId(url) {
    const regExp = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  function getVimeoId(url) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }
  
  window.openCustomVideoPopup = openCustomVideoPopup;
  window.closeCustomVideoPopup = closeCustomVideoPopup;

  function setupCustomControls(video) {
    const timeDisplay = document.getElementById('time-display');
    const seekBar = document.getElementById('seek-bar');
    const muteBtn = document.getElementById('mute-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
  
    video.addEventListener('loadedmetadata', () => {
      seekBar.max = video.duration;
      updateTimeDisplay();
    });
  
    video.addEventListener('timeupdate', () => {
      seekBar.value = video.currentTime;
      updateTimeDisplay();
    });
  
    seekBar.addEventListener('input', () => {
      video.currentTime = seekBar.value;
    });
  
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.innerHTML = video.muted ? iconMute : iconSound;
    });
  
    fullscreenBtn.addEventListener('click', () => {
      const wrapper = document.querySelector('#custom-video-popup .video-wrapper');
    
      if (!document.fullscreenElement) {
        if (wrapper.requestFullscreen) {
          wrapper.requestFullscreen();
        } else if (wrapper.webkitRequestFullscreen) {
          wrapper.webkitRequestFullscreen();
        } else if (wrapper.msRequestFullscreen) {
          wrapper.msRequestFullscreen();
        }
    
        if (!isAppleDevice() && screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(err => {
            console.warn('Orientation lock failed:', err);
          });
        }
      } else {
        document.exitFullscreen();
    
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    });    
  
    function updateTimeDisplay() {
      const format = t => {
        if (isNaN(t)) return '0:00';
        const minutes = Math.floor(t / 60);
        const seconds = Math.floor(t % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
      };

      const current = format(video.currentTime);
      const duration = format(video.duration);
      timeDisplay.textContent = `${current} / ${duration}`;
    }
  }

  function debounce(func, wait = 100) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

    window.debounce = debounce;

    function observeAnimation(el, animateClass = 'animate', threshold = 0.6) {
      const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(animateClass);
            observerInstance.unobserve(entry.target);
          }
        });
      }, {
        threshold
      });
  
      observer.observe(el);
    }
  
    window.observeAnimation = observeAnimation;
  
  // Keep your scripts inside this IIFE function call to avoid leaking your variables into the global scope.
})();
