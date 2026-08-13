/* Double hero video section
 * - <double-hero-video>: left/right panel state machine (ambient autoplay,
 *   hover teaser, CTA roll, width swap) and the shared fullscreen theater.
 * - Supports Shopify-hosted video and Vimeo (via the Vimeo Player SDK, kept
 *   behind the same engine interface as the native <video> element).
 */
(function () {
  'use strict';

  if (customElements.get('double-hero-video')) return;

  var VIMEO_SDK_URL = 'https://player.vimeo.com/api/player.js';
  var vimeoSdkPromise = null;

  function loadVimeoSdk() {
    if (window.Vimeo && window.Vimeo.Player) return Promise.resolve(window.Vimeo);
    if (vimeoSdkPromise) return vimeoSdkPromise;

    vimeoSdkPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = VIMEO_SDK_URL;
      script.onload = function () {
        resolve(window.Vimeo);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return vimeoSdkPromise;
  }

  function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasHoverInput() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function requestFullscreen(el) {
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!fn) return;
    try {
      const r = fn.call(el);
      if (r && r.catch) r.catch(function () {});
    } catch (e) {}
  }

  function exitFullscreen() {
    if (!fullscreenElement()) return;
    const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (!fn) return;
    try {
      const r = fn.call(document);
      if (r && r.catch) r.catch(function () {});
    } catch (e) {}
  }

  // Autoplay a panel's video only while it's in the viewport. Two separate DB
  // sections (layout "first"/"second") both autoplay on mobile; starting both
  // at once made them contend so the first video sometimes never began.
  // Gating on visibility means only the on-screen video plays at a time —
  // reliable, and lighter on battery/data. Falls back to immediate play when
  // IntersectionObserver is unavailable.
  function autoplayInView(panel, handlers) {
    if (typeof IntersectionObserver === 'undefined') {
      if (handlers.shouldPlay()) handlers.play();
      return null;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          if (handlers.shouldPlay()) handlers.play();
        } else {
          handlers.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(panel);
    return observer;
  }

  // Pick the video mount for the current breakpoint. A panel has two mounts
  // (data-breakpoint "desktop"/"mobile") only when a separate mobile asset is
  // set; otherwise there's a single mount (empty breakpoint) used everywhere.
  function pickMount(panel) {
    var mounts = panel.querySelectorAll('[data-dhv-video]');
    if (mounts.length <= 1) return mounts[0] || null;
    var wanted = window.matchMedia('(max-width: 749px)').matches ? 'mobile' : 'desktop';
    for (var i = 0; i < mounts.length; i++) {
      if (mounts[i].getAttribute('data-breakpoint') === wanted) return mounts[i];
    }
    return mounts[0];
  }

  // Extract the numeric id and (for unlisted/private videos) the privacy hash
  // from any Vimeo link the merchant pastes. Handles the share form
  // vimeo.com/{id}/{hash}, a bare vimeo.com/{id}, and the embed form
  // player.vimeo.com/video/{id}?h={hash}.
  function parseVimeoUrl(url) {
    if (!url) return { id: null, hash: null };
    var idMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    var hash = null;
    var queryHash = url.match(/[?&]h=([A-Za-z0-9]+)/);
    if (queryHash) {
      hash = queryHash[1];
    } else {
      var pathHash = url.match(/vimeo\.com\/(?:video\/)?\d+\/([A-Za-z0-9]+)/);
      if (pathHash) hash = pathHash[1];
    }
    return { id: idMatch ? idMatch[1] : null, hash: hash };
  }

  /* -------------------------------------------------------------- */
  /* Video engines: one shared interface for native <video> and Vimeo */
  /* -------------------------------------------------------------- */

  function Emitter() {
    this._listeners = {};
  }
  Emitter.prototype.on = function (evt, cb) {
    (this._listeners[evt] = this._listeners[evt] || []).push(cb);
    return this;
  };
  Emitter.prototype.emit = function (evt, payload) {
    (this._listeners[evt] || []).forEach(function (cb) {
      cb(payload);
    });
  };

  function NativeVideoEngine(video) {
    Emitter.call(this);
    this.type = 'native';
    this.video = video;

    var self = this;
    video.addEventListener('timeupdate', function () {
      self.emit('timeupdate', { currentTime: self.getCurrentTime(), duration: self.getDuration() });
    });
    video.addEventListener('ended', function () {
      self.emit('ended');
    });
    video.addEventListener('play', function () {
      self.emit('play');
    });
    video.addEventListener('pause', function () {
      self.emit('pause');
    });
    video.addEventListener('volumechange', function () {
      self.emit('volumechange', { muted: video.muted });
    });
  }
  NativeVideoEngine.prototype = Object.create(Emitter.prototype);
  NativeVideoEngine.prototype.play = function () {
    var promise = this.video.play();
    return promise && promise.catch ? promise.catch(function () {}) : Promise.resolve();
  };
  // Raw (non-swallowing) play so the caller can detect an autoplay block.
  NativeVideoEngine.prototype.rawPlay = function () {
    return this.video.play() || Promise.resolve();
  };
  NativeVideoEngine.prototype.pause = function () {
    this.video.pause();
  };
  NativeVideoEngine.prototype.seek = function (time) {
    try {
      this.video.currentTime = time;
    } catch (e) {
      /* ignore seek errors before metadata is ready */
    }
  };
  NativeVideoEngine.prototype.getCurrentTime = function () {
    return this.video.currentTime || 0;
  };
  NativeVideoEngine.prototype.getDuration = function () {
    return this.video.duration || 0;
  };
  // Returns a promise so callers can chain setMuted().then(play) identically
  // across both engines — the Vimeo one is inherently async.
  NativeVideoEngine.prototype.setMuted = function (muted) {
    this.video.muted = muted;
    return Promise.resolve(muted);
  };
  NativeVideoEngine.prototype.getMuted = function () {
    return this.video.muted;
  };
  NativeVideoEngine.prototype.destroy = function () {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
  };

  function VimeoVideoEngine(player) {
    Emitter.call(this);
    this.type = 'vimeo';
    this.player = player;
    this._currentTime = 0;
    this._duration = 0;
    this._muted = true;

    var self = this;
    player.getDuration().then(function (d) {
      self._duration = d;
    });
    player.getMuted().then(function (m) {
      self._muted = m;
    });
    // iOS reports volume: 1 even while muted (volume is hardware-controlled),
    // so only an explicit muted flag is trustworthy; volume 0 still means
    // muted, and anything else leaves the local state alone.
    player.on('volumechange', function (data) {
      if (typeof data.muted === 'boolean') {
        self._muted = data.muted;
      } else if (data.volume === 0) {
        self._muted = true;
      } else {
        return;
      }
      self.emit('volumechange', { muted: self._muted });
    });
    player.on('timeupdate', function (data) {
      self._currentTime = data.seconds;
      self._duration = data.duration;
      self.emit('timeupdate', { currentTime: data.seconds, duration: data.duration });
    });
    player.on('ended', function () {
      self.emit('ended');
    });
    player.on('play', function () {
      self.emit('play');
    });
    player.on('pause', function () {
      self.emit('pause');
    });
  }
  VimeoVideoEngine.prototype = Object.create(Emitter.prototype);
  VimeoVideoEngine.prototype.play = function () {
    return this.player.play().catch(function () {});
  };
  // Raw (non-swallowing) play so the caller can detect an autoplay block.
  VimeoVideoEngine.prototype.rawPlay = function () {
    return this.player.play();
  };
  VimeoVideoEngine.prototype.pause = function () {
    return this.player.pause().catch(function () {});
  };
  VimeoVideoEngine.prototype.seek = function (time) {
    return this.player.setCurrentTime(time).catch(function () {});
  };
  VimeoVideoEngine.prototype.getCurrentTime = function () {
    return this._currentTime;
  };
  VimeoVideoEngine.prototype.getDuration = function () {
    return this._duration;
  };
  /**
   * setMuted() is the only reliable audio control on iOS: volume there is
   * hardware-controlled, so setVolume() is a documented no-op and can reject.
   * Chaining it after a successful setMuted() used to drag the whole promise
   * into .catch(), which callers read as "unmuted playback was blocked" and
   * answered by re-muting.
   */
  VimeoVideoEngine.prototype.setMuted = function (muted) {
    var self = this;
    this._muted = muted;

    var action;
    if (typeof this.player.setMuted === 'function') {
      action = this.player.setMuted(muted);
    } else {
      action = this.player.setVolume(muted ? 0 : 1);
    }

    return Promise.resolve(action)
      .catch(function () {})
      .then(function () {
        self.emit('volumechange', { muted: muted });
        return muted;
      });
  };
  VimeoVideoEngine.prototype.getMuted = function () {
    return this._muted;
  };
  VimeoVideoEngine.prototype.destroy = function () {
    this.player.destroy();
  };

  /**
   * `object-fit` has no effect on <iframe> in Chrome/Safari, so a Vimeo
   * embed always letterboxes to its own aspect ratio inside the iframe box
   * no matter what CSS is applied to it. To get the same crop-to-fill
   * result as `object-fit: cover`, the iframe itself has to be oversized
   * and centered based on the *video's* real aspect ratio vs the
   * container's — the same math object-fit does internally.
   */
  function applyIframeCover(iframe, player, container) {
    var ratio = null;

    function resize() {
      if (!ratio) return;
      var rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      // Overscan 2px on the fitted dimension so sub-pixel rounding can
      // never leave a hairline gap at the edges/corners; the extra is
      // clipped by the container (overflow/clip-path), centered.
      var w = rect.width + 2;
      var h = rect.height + 2;

      if (w / h > ratio) {
        iframe.style.width = w + 'px';
        iframe.style.height = w / ratio + 'px';
      } else {
        iframe.style.height = h + 'px';
        iframe.style.width = h * ratio + 'px';
      }
    }

    Promise.all([player.getVideoWidth(), player.getVideoHeight()])
      .then(function (size) {
        ratio = size[1] ? size[0] / size[1] : 16 / 9;
        resize();
      })
      .catch(function () {});

    // Re-measure once playback actually starts — by then the container is
    // guaranteed laid out (covers the display:none → shown race in theater).
    player.on('play', resize);

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    // Returned so callers can force a re-measure. In the theater the
    // container is display:none when this runs, and ResizeObserver on a
    // hidden→shown transition is unreliable — the theater calls this again
    // once it's visible so the cover math uses the real dimensions.
    return resize;
  }

  /**
   * Builds (or reuses) a video engine from a `[data-dhv-video]` mount.
   * `loop` only matters for Vimeo, which needs it set on the iframe URL.
   * `cover` (default true) applies the iframe cover-crop fix above; pass
   * `false` for contexts that intentionally want letterboxing (e.g. the
   * desktop theater stage).
   */
  function createEngineFromMount(mount, options) {
    if (!mount) return Promise.resolve(null);
    options = options || {};

    var type = mount.getAttribute('data-video-type');

    if (type === 'shopify') {
      var video = mount.querySelector('video');
      if (video && options.loop != null) {
        video.loop = !!options.loop;
      }
      return Promise.resolve(video ? new NativeVideoEngine(video) : null);
    }

    if (type === 'vimeo') {
      // The mount carries the full pasted link; derive the id (and, for
      // private videos, the privacy hash — without it a private embed shows
      // "Sorry, we're having trouble").
      var parsedVimeo = parseVimeoUrl(mount.getAttribute('data-video-url'));
      var videoId = parsedVimeo.id;
      if (!videoId) return Promise.resolve(null);
      var videoHash = parsedVimeo.hash;

      return loadVimeoSdk()
        .then(function (Vimeo) {
          var iframe = mount.querySelector('iframe');
          if (!iframe) {
            // Panels start muted (ambient/teaser autoplay); the theater
            // wants sound, so it must NOT load with muted=1 — that param
            // locks the embed into muted-autoplay and a later setMuted(false)
            // can't reliably restore audio.
            var muted = options.muted === false ? '0' : '1';
            iframe = document.createElement('iframe');
            iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            iframe.src =
              'https://player.vimeo.com/video/' +
              videoId +
              '?controls=0&background=0&muted=' +
              muted +
              '&playsinline=1&title=0&byline=0&portrait=0&loop=' +
              (options.loop ? '1' : '0') +
              (videoHash ? '&h=' + encodeURIComponent(videoHash) : '');
            mount.appendChild(iframe);
          }
          var player = new Vimeo.Player(iframe);
          var engine = new VimeoVideoEngine(player);
          if (options.cover !== false) {
            engine.coverResize = applyIframeCover(iframe, player, mount);
          }
          return engine;
        })
        .catch(function () {
          return null;
        });
    }

    return Promise.resolve(null);
  }

  /* -------------------------------------------------------------- */
  /* Theater: fullscreen playback shared by both panels               */
  /* -------------------------------------------------------------- */

  function Theater(root) {
    this.root = root;
    this.videoMount = root.querySelector('[data-dhv-theater-video]');
    this.chrome = root.querySelector('[data-dhv-theater-chrome]');
    this.playPauseButton = root.querySelector('[data-dhv-theater-playpause]');
    this.muteButton = root.querySelector('[data-dhv-theater-mute]');
    this.closeButtons = root.querySelectorAll('[data-dhv-theater-close]');
    this.scrubber = root.querySelector('[data-dhv-scrubber]');
    this.scrubberFill = root.querySelector('[data-dhv-scrubber-fill]');
    this.scrubberHandle = root.querySelector('[data-dhv-scrubber-handle]');
    this.timeEl = root.querySelector('[data-dhv-theater-time]');
    this.watchingEl = root.querySelector('[data-dhv-theater-watching]');

    this.engine = null;
    this.isDraggingScrubber = false;
    this.idleTimer = null;
    this.onCloseCallback = null;

    this._bindStaticEvents();
  }

  Theater.prototype._bindStaticEvents = function () {
    var self = this;

    this.closeButtons.forEach((closeBtn) => {
      closeBtn.addEventListener('click', function () {
        self.close();
      });
    });

    this.playPauseButton.addEventListener('click', function () {
      if (!self.engine) return;

      if (self.playPauseButton.getAttribute('data-state') === 'playing') {
        self.engine.pause();
        return;
      }

      // The very first press in play-button mode is the gesture that
      // authorises audio, so unmute inside it rather than leaving the viewer
      // to find the sound button afterwards. Later presses are plain resumes
      // and must not undo a deliberate mute.
      if (self.awaitingFirstPress) {
        self.awaitingFirstPress = false;
        self.engine.setMuted(false).then(function () {
          self._setMuteState(false);
          self.engine.play();
        });
        return;
      }

      self.engine.play();
    });

    this.muteButton.addEventListener('click', function (event) {
      // Keep the click off the play/pause button underneath.
      event.stopPropagation();
      if (!self.engine) return;
      var nextMuted = self.muteButton.getAttribute('data-muted') !== 'true';
      self.awaitingFirstPress = false;
      self.engine.setMuted(nextMuted);
      self._setMuteState(nextMuted);
    });

    this.root.addEventListener('pointermove', function () {
      self._showControls();
    });
    this.root.addEventListener('pointerdown', function () {
      self._showControls();
    });

    // document/window listeners outlive this section's DOM when Shopify
    // re-renders it in the Theme Editor, so they're tracked for cleanup
    // in destroy() instead of relying on the node being garbage collected.
    this._onKeydown = function (event) {
      if (self.root.hasAttribute('hidden')) return;
      if (event.key === 'Escape') self.close();
    };
    document.addEventListener('keydown', this._onKeydown);

    this._onFsChange = function () {
      if (!fullscreenElement() && self.root.classList.contains('is-open')) {
        self.close();
      }
    };
    document.addEventListener('fullscreenchange', this._onFsChange);
    document.addEventListener('webkitfullscreenchange', this._onFsChange);

    this.scrubber.addEventListener('pointerdown', function (event) {
      self.isDraggingScrubber = true;
      self._seekFromPointer(event);
    });

    this._onWindowPointerMove = function (event) {
      if (self.isDraggingScrubber) self._seekFromPointer(event);
    };
    window.addEventListener('pointermove', this._onWindowPointerMove);

    this._onWindowPointerUp = function () {
      self.isDraggingScrubber = false;
    };
    window.addEventListener('pointerup', this._onWindowPointerUp);

    this.scrubber.addEventListener('keydown', function (event) {
      if (!self.engine) return;
      var current = self.engine.getCurrentTime();
      var duration = self.engine.getDuration();

      if (event.key === 'ArrowLeft') self.engine.seek(Math.max(0, current - 5));
      else if (event.key === 'ArrowRight') self.engine.seek(Math.min(duration, current + 5));
      else if (event.key === 'Home') self.engine.seek(0);
      else if (event.key === 'End') self.engine.seek(duration);
      else return;

      event.preventDefault();
    });
  };

  Theater.prototype.destroy = function () {
    document.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('fullscreenchange', this._onFsChange);
    document.removeEventListener('webkitfullscreenchange', this._onFsChange);
    window.removeEventListener('pointermove', this._onWindowPointerMove);
    window.removeEventListener('pointerup', this._onWindowPointerUp);
    clearTimeout(this.idleTimer);
    if (this.engine) this.engine.destroy();
  };

  Theater.prototype._seekFromPointer = function (event) {
    if (!this.engine) return;

    var rect = this.scrubber.getBoundingClientRect();
    var ratio = (event.clientX - rect.left) / rect.width;
    ratio = Math.min(1, Math.max(0, ratio));

    this.engine.seek(ratio * this.engine.getDuration());
  };

  Theater.prototype._showControls = function () {
    var self = this;

    this.root.classList.add('controls-visible');

    clearTimeout(this.idleTimer);
    // Never idle-hide while paused: the play disc is the only way back into
    // playback, so fading it out would leave a still frame and no controls.
    if (this.playPauseButton && this.playPauseButton.getAttribute('data-state') === 'paused') {
      return;
    }
    this.idleTimer = setTimeout(function () {
      self.root.classList.remove('controls-visible');
    }, 2500);
  };

  Theater.prototype._bindEngine = function (engine) {
    var self = this;
    this.engine = engine;

    engine.on('timeupdate', function (data) {
      var duration = data.duration || 0;
      var ratio = duration ? data.currentTime / duration : 0;

      self.scrubberFill.style.width = ratio * 100 + '%';
      self.scrubberHandle.style.left = ratio * 100 + '%';
      self.timeEl.style.left = ratio * 100 + '%';
      self.scrubber.setAttribute('aria-valuenow', Math.round(ratio * 100));
      self.timeEl.textContent = formatTime(data.currentTime);
    });

    engine.on('play', function () {
      self._setPlayPauseState('playing');
    });
    engine.on('pause', function () {
      self._setPlayPauseState('paused');
    });

    // Keep the mute button in sync with the real state — e.g. the browser
    // may force-mute an unmuted autoplay, and we want the icon to reflect
    // that rather than lie.
    engine.on('volumechange', function (data) {
      self._setMuteState(!!data.muted);
    });
  };

  Theater.prototype._setPlayPauseState = function (state) {
    var button = this.playPauseButton;
    button.setAttribute('data-state', state);
    button.setAttribute(
      'aria-label',
      state === 'playing' ? button.dataset.labelPause : button.dataset.labelPlay
    );
  };

  Theater.prototype._setMuteState = function (muted) {
    var button = this.muteButton;
    button.setAttribute('data-muted', muted ? 'true' : 'false');
    button.setAttribute(
      'aria-label',
      muted ? button.dataset.labelUnmute : button.dataset.labelMute
    );
  };

  Theater.prototype._resetScrubber = function (startTime) {
    startTime = startTime || 0;
    if (this.scrubberFill) this.scrubberFill.style.width = '0%';
    if (this.scrubberHandle) this.scrubberHandle.style.left = '0%';
    if (this.timeEl) {
      this.timeEl.style.left = '0%';
      this.timeEl.textContent = formatTime(startTime);
    }
    if (this.scrubber) this.scrubber.setAttribute('aria-valuenow', '0');
  };

  /**
   * @param {HTMLElement} panelMount - the panel's `[data-dhv-video]` element.
   * @param {{ title: string, duration: string, startTime: number, onClose: function }} meta
   */
  Theater.prototype.open = function (panelMount, meta) {
    var self = this;
    meta = meta || {};

    var type = panelMount.getAttribute('data-video-type');
    // Play-button mode means the viewer presses play; "Watch fullscreen" only
    // opens the stage. Autoplay mode keeps the old behaviour of starting
    // straight away, which is what its CTA promises.
    var waitForPress = meta.waitForPress === true;
    this.awaitingFirstPress = false;

    this.videoMount.innerHTML = '';
    this.onCloseCallback = meta.onClose || null;
    this._setPlayPauseState(waitForPress ? 'paused' : 'playing');
    this._setMuteState(false);
    this._resetScrubber(meta.startTime || 0);

    var enginePromise;

    if (type === 'shopify') {
      var original = panelMount.querySelector('video');
      if (!original) return;

      var clone = original.cloneNode(true);
      clone.removeAttribute('autoplay');
      clone.loop = false;
      clone.muted = false;
      clone.setAttribute('playsinline', '');
      clone.controls = false;
      this.videoMount.appendChild(clone);
      enginePromise = Promise.resolve(new NativeVideoEngine(clone));
    } else if (type === 'vimeo') {
      var vimeoMount = document.createElement('div');
      vimeoMount.setAttribute('data-video-type', 'vimeo');
      vimeoMount.setAttribute('data-video-url', panelMount.getAttribute('data-video-url'));
      // Must fill the stage: applyIframeCover measures this element to
      // size the iframe, and a bare div would be 0px tall (no cover calc,
      // and the absolutely-positioned iframe would have no containing box).
      vimeoMount.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      this.videoMount.appendChild(vimeoMount);
      // Keep native aspect ratio (contain) on all viewports without zoom cropping.
      enginePromise = createEngineFromMount(vimeoMount, { loop: false, cover: false, muted: false });
    } else {
      return;
    }

    this._show();
    this.watchingEl.textContent = meta.title
      ? "Watching: '" + meta.title + "' " + (meta.duration || '')
      : '';

    enginePromise.then(function (engine) {
      if (!engine) return;

      self._bindEngine(engine);
      // Unconditional: a player reused across opens keeps its old position,
      // so "start at 0" has to be an explicit seek rather than a skipped one.
      engine.seek(meta.startTime || 0);

      if (waitForPress) {
        // Stay on the first frame with the play disc showing. Pre-unmuting is
        // pointless here — the press will do it inside its own gesture, which
        // is where browsers actually grant audio.
        self.awaitingFirstPress = true;
        engine.setMuted(true).then(function () {
          self._setMuteState(true);
        });
        self._showControls();
        return;
      }

      // Try to play WITH sound (the theater opened from a user gesture, and
      // the CTA promises "Play with sound"). If the browser blocks unmuted
      // playback (autoplay policy / low media-engagement), fall back to
      // muted so the video still plays — the mute button then unmutes on a
      // fresh click. rawPlay() rejects on a block (play() swallows it).
      engine
        .setMuted(false)
        .then(function () {
          self._setMuteState(false);
          return engine.rawPlay();
        })
        .catch(function () {
          return engine.setMuted(true).then(function () {
            self._setMuteState(true);
            return engine.play();
          });
        });

      // Recompute the Vimeo cover now that the theater is visible and laid
      // out (the initial measure ran while it was still display:none).
      // Two rAFs so the show + inset CSS have settled before measuring.
      if (engine.coverResize) {
        requestAnimationFrame(function () {
          requestAnimationFrame(engine.coverResize);
        });
      }
    });
  };

  Theater.prototype._show = function () {
    requestFullscreen(this.root);
    var self = this;

    this.root.hidden = false;
    document.documentElement.classList.add('dhv-theater-open');
    document.dispatchEvent(new CustomEvent('theme:scroll:lock', { bubbles: true }));

    if (window.theme && window.theme.a11y) {
      window.theme.a11y.trapFocus(this.root, { elementToFocus: this.closeButtons[0] });
    }

    requestAnimationFrame(function () {
      self.root.classList.add('is-open');
      self._showControls();
    });
  };

  Theater.prototype.close = function () {
    var self = this;

    this.root.classList.remove('is-open', 'controls-visible');
    exitFullscreen();
    this._resetScrubber(0);

    document.documentElement.classList.remove('dhv-theater-open');
    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', { bubbles: true }));

    if (window.theme && window.theme.a11y) {
      window.theme.a11y.removeTrapFocus();
    }

    clearTimeout(this.idleTimer);

    setTimeout(function () {
      self.root.hidden = true;
      if (self.engine) {
        self.engine.destroy();
        self.engine = null;
      }
      self.videoMount.innerHTML = '';
    }, 300);

    if (this.onCloseCallback) {
      var callback = this.onCloseCallback;
      this.onCloseCallback = null;
      callback();
    }
  };

  /* -------------------------------------------------------------- */
  /* <double-hero-video>: the two-panel hover / teaser state machine  */
  /* -------------------------------------------------------------- */

  customElements.define(
    'double-hero-video',
    class extends HTMLElement {
      connectedCallback() {
        // The theme editor detaches/reattaches this node when sections are
        // added, duplicated or reordered — so connectedCallback can fire more
        // than once. Setup runs only on the first connect; the theater was
        // portaled to <body> (there's no theater child left to re-query), so
        // on a reconnect we just re-attach the existing one.
        if (this._dhvSetup) {
          if (this.theater && this.theater.root && !this.theater.root.parentNode) {
            document.body.appendChild(this.theater.root);
          }
          return;
        }
        this._dhvSetup = true;

        this.ambientPanel = this.querySelector('[data-dhv-panel="ambient"]');
        this.teaserPanel = this.querySelector('[data-dhv-panel="teaser"]');
        this.layoutRule = this.getAttribute('data-layout-rule') || 'off';

        var theaterEl = this.querySelector('[data-dhv-theater]');
        if (theaterEl) {
          // Move the theater overlay to a direct child of <body>. If it stays
          // nested inside the section, any ancestor with a CSS transform (this
          // theme uses transform-based scroll-reveal animations) would become
          // its containing block and break `position: fixed` full-viewport sizing.
          document.body.appendChild(theaterEl);
          this.theater = new Theater(theaterEl);
        }

        // Playback mode is per video, read off each panel. The two settings
        // are resolved in Liquid so the markup and the behaviour can never
        // disagree: a visible play button means no autoplay and audio on first
        // press; autoplay mode starts muted (the only autoplay any browser
        // permits) and shows a mute toggle instead.
        this.ambientMode = this._readPanelMode(this.ambientPanel);
        this.teaserMode = this._readPanelMode(this.teaserPanel);

        this.reduceMotion = prefersReducedMotion();
        this.ambientEngine = null;
        this.ambientManuallyPaused = false;
        this.teaserEngine = null;
        this.teaserManuallyPaused = false;

        if (this.ambientPanel) this._initAmbientPanel();
        if (this.teaserPanel) this._initTeaserPanel();

        // Separate desktop/mobile assets: re-pick the active mount when the
        // viewport crosses the mobile breakpoint (device rotation, or a desktop
        // window resized across 749px). Only wired up when a panel actually has
        // two mounts, so single-asset sections pay nothing.
        if (this._hasResponsiveAssets()) {
          var self = this;
          var mq = window.matchMedia('(max-width: 749px)');
          var onBreakpointChange = function () {
            if (self.ambientPanel) self._setupAmbientEngine();
            if (self.teaserPanel) self._setupTeaserEngine();
          };
          if (mq.addEventListener) mq.addEventListener('change', onBreakpointChange);
          else if (mq.addListener) mq.addListener(onBreakpointChange);
        }
      }

      _readPanelMode(panel) {
        if (!panel) return { showPlayButton: false, autoplay: false };
        return {
          showPlayButton: panel.getAttribute('data-show-play-button') === 'true',
          autoplay: panel.getAttribute('data-autoplay') === 'true',
        };
      }

      _hasResponsiveAssets() {
        return (
          (this.ambientPanel && this.ambientPanel.querySelectorAll('[data-dhv-video]').length > 1) ||
          (this.teaserPanel && this.teaserPanel.querySelectorAll('[data-dhv-video]').length > 1)
        );
      }

      disconnectedCallback() {
        // Keep the portaled theater instance and its bound controls alive so a
        // reconnect can re-attach it; just detach the node so no orphaned
        // overlay lingers. (Its transient video engine is destroyed on close.)
        if (this.theater) {
          if (this.theater.root.classList.contains('is-open')) this.theater.close();
          if (this.theater.root.parentNode) {
            this.theater.root.parentNode.removeChild(this.theater.root);
          }
        }
      }

      _initAmbientPanel() {
        var self = this;
        var toggle = this.ambientPanel.querySelector('[data-dhv-pause-toggle]');
        var cta = this.ambientPanel.querySelector('[data-dhv-open-theater]');
        var media = this.ambientPanel.querySelector('.dhv__media');
        var muteToggle = this.ambientPanel.querySelector('[data-dhv-mute-toggle]');
        this._ambientToggle = toggle;
        this._ambientMuteToggle = muteToggle;

        // Static listeners bound once. They read self.ambientEngine /
        // self.ambientMount, which _setupAmbientEngine swaps on breakpoint
        // changes — so they keep working across desktop/mobile asset switches.
        if (toggle) {
          toggle.addEventListener('click', function () {
            if (!self.ambientEngine) return;

            if (self.ambientPanel.classList.contains('is-playing')) {
              self.ambientManuallyPaused = true;
              self.ambientEngine.pause();
              return;
            }

            self.ambientManuallyPaused = false;
            self._playWithIntendedSound(self.ambientEngine, self.ambientMode);
          });
        }

        if (muteToggle) this._bindMuteToggle(muteToggle, 'ambient');

        // Hover only rolls the CTA label ("Watch fullscreen" -> "Play with
        // sound") to match the teaser CTA. No width swap or preview here —
        // that behaviour is exclusive to the teaser panel.
        if (hasHoverInput() && !this.reduceMotion) {
          this.ambientPanel.addEventListener('mouseenter', function () {
            self.ambientPanel.classList.add('is-hover');
          });
          this.ambientPanel.addEventListener('mouseleave', function () {
            self.ambientPanel.classList.remove('is-hover');
          });
        }

        function openTheater() {
          self._openTheater(self.ambientPanel, self.ambientMount, self.ambientEngine, {
            onClose: function () {
              if (!self.ambientManuallyPaused && !self.reduceMotion && self.ambientEngine) {
                self.ambientEngine.play();
              }
            },
          });
        }

        if (cta) cta.addEventListener('click', openTheater);

        if (media) {
          media.addEventListener('click', function (event) {
            if (toggle && toggle.contains(event.target)) return;
            if (cta && cta.contains(event.target)) return;
            openTheater();
          });
        }

        this._setupAmbientEngine();
      }

      // (Re)build the ambient engine for the current breakpoint's mount. Called
      // on init and again whenever the mobile breakpoint is crossed.
      _setupAmbientEngine() {
        var self = this;
        var toggle = this._ambientToggle;

        if (this._ambientObserver) {
          this._ambientObserver.disconnect();
          this._ambientObserver = null;
        }
        if (this.ambientEngine) {
          this.ambientEngine.destroy();
          this.ambientEngine = null;
        }
        this.ambientPanel.classList.remove('is-playing', 'is-revealed');

        this.ambientMount = pickMount(this.ambientPanel);

        createEngineFromMount(this.ambientMount, { loop: true }).then(function (engine) {
          if (!engine) return;
          self.ambientEngine = engine;

          engine.on('play', function () {
            self.ambientPanel.classList.add('is-playing', 'is-revealed');
            self._setToggleState(toggle, 'playing');
          });
          engine.on('pause', function () {
            self.ambientPanel.classList.remove('is-playing');
            self._setToggleState(toggle, 'paused');
          });

          // Keep the mute toggle in sync with whatever changed the volume,
          // including Vimeo's own controls in fullscreen.
          engine.on('volumechange', function (data) {
            self._setMuteToggleState(self._ambientMuteToggle, !!data.muted);
          });

          // Autoplay in view — only when the section is set to autoplay.
          // Skipped entirely for layout "second" (this copy never shows its
          // ambient video). Respects a manual pause so it doesn't resume a
          // video the user paused.
          if (!self.ambientMode.autoplay) return;

          self._ambientObserver = autoplayInView(self.ambientPanel, {
            shouldPlay: function () {
              return !self.reduceMotion && self.layoutRule !== 'second' && !self.ambientManuallyPaused;
            },
            play: function () {
              // Muted is mandatory here: no gesture has happened yet, so an
              // audible autoplay would simply be refused.
              engine.setMuted(true);
              engine.play();
            },
            pause: function () {
              engine.pause();
            },
          });
        });
      }

      /**
       * Starts playback with the sound state the current mode implies. In
       * play-button mode the press itself is the viewer's consent for audio,
       * so it unmutes first rather than starting silent and making them hunt
       * for a second control. Unmuting before play() also keeps the whole
       * thing inside the click's user activation, which is what browsers
       * require for audible playback.
       */
      _playWithIntendedSound(engine, mode) {
        if (!engine) return;
        if (!mode || !mode.showPlayButton) {
          engine.play();
          return;
        }
        engine.setMuted(false).then(function () {
          engine.play();
        });
      }

      _bindMuteToggle(button, which) {
        var self = this;

        button.addEventListener('click', function (event) {
          // The media wrapper opens the theater on click, so this must not
          // bubble up to it.
          event.stopPropagation();
          var engine = which === 'ambient' ? self.ambientEngine : self.teaserEngine;
          if (!engine) return;

          var nextMuted = button.getAttribute('data-muted') !== 'true';
          engine.setMuted(nextMuted).then(function () {
            self._setMuteToggleState(button, nextMuted);
            // Re-issue play() when unmuting: this click is the user gesture
            // that authorises audio, and some browsers only apply the new
            // volume state on the next play call.
            if (!nextMuted) engine.play();
          });
        });
      }

      _setMuteToggleState(button, muted) {
        if (!button) return;
        button.setAttribute('data-muted', muted ? 'true' : 'false');
        button.setAttribute(
          'aria-label',
          muted ? button.dataset.labelUnmute : button.dataset.labelMute
        );
      }

      _setToggleState(toggle, state) {
        if (!toggle) return;
        toggle.setAttribute('data-state', state);
        toggle.setAttribute(
          'aria-label',
          state === 'playing' ? toggle.dataset.labelPause : toggle.dataset.labelPlay
        );
      }

      _initTeaserPanel() {
        var self = this;
        var cta = this.teaserPanel.querySelector('[data-dhv-open-theater]');
        var media = this.teaserPanel.querySelector('.dhv__media');
        var toggle = this.teaserPanel.querySelector('[data-dhv-pause-toggle]');
        var muteToggle = this.teaserPanel.querySelector('[data-dhv-mute-toggle]');
        this._teaserToggle = toggle;
        this._teaserMuteToggle = muteToggle;

        // Creates the teaser engine for the CURRENT mount (self.teaserMount) on
        // demand and binds its play/pause events. Cached until torn down by
        // _setupTeaserEngine (which nulls teaserEngine so the next call rebuilds
        // against the new breakpoint's mount).
        function ensureEngine() {
          if (self.teaserEngine) return Promise.resolve(self.teaserEngine);
          // Loop continuously while hovered on desktop or autoplayed on mobile.
          return createEngineFromMount(self.teaserMount, { loop: true }).then(function (engine) {
            if (!engine) return null;
            self.teaserEngine = engine;
            engine.on('play', function () {
              self.teaserPanel.classList.add('is-playing', 'is-revealed');
              self._setToggleState(self._teaserToggle, 'playing');
            });
            engine.on('pause', function () {
              self.teaserPanel.classList.remove('is-playing');
              self._setToggleState(self._teaserToggle, 'paused');
            });
            engine.on('volumechange', function (data) {
              self._setMuteToggleState(self._teaserMuteToggle, !!data.muted);
            });
            return engine;
          });
        }
        this._teaserEnsureEngine = ensureEngine;

        if (toggle) {
          toggle.addEventListener('click', function (event) {
            event.stopPropagation();

            if (self.teaserPanel.classList.contains('is-playing')) {
              self.teaserManuallyPaused = true;
              if (self.teaserEngine) self.teaserEngine.pause();
              return;
            }

            self.teaserManuallyPaused = false;
            // The engine is lazy on this panel, so it may not exist until the
            // first press — but the unmute still has to happen inside this
            // click, hence the chained call rather than a bare play().
            ensureEngine().then(function (engine) {
              self._playWithIntendedSound(engine, self.teaserMode);
            });
          });
        }

        if (muteToggle) this._bindMuteToggle(muteToggle, 'teaser');

        // Desktop (mouse): hover previews the teaser and pauses the ambient.
        // Mobile autoplay is wired in _setupTeaserEngine instead. Bound once —
        // input type doesn't change on resize, only the asset does.
        // The hover panel-expand runs in every mode: data-hover drives the
        // flex-grow split between the two panels, which is layout, not
        // playback. Only the preview playback inside it follows the autoplay
        // setting — in play-button mode the teaser widens on hover but stays
        // on its poster until pressed.
        if (hasHoverInput() && !this.reduceMotion) {
          this.teaserPanel.addEventListener('mouseenter', function () {
            self.setAttribute('data-hover', 'teaser');
            self.teaserPanel.classList.add('is-hover');

            if (!self.teaserMode.autoplay) return;

            if (self.ambientEngine && !self.ambientManuallyPaused) {
              self.ambientEngine.pause();
            }

            ensureEngine().then(function (engine) {
              if (!engine) return;
              engine.setMuted(true);
              engine.seek(0);
              engine.play();
            });
          });

          this.teaserPanel.addEventListener('mouseleave', function () {
            self.removeAttribute('data-hover');
            self.teaserPanel.classList.remove('is-hover');

            if (!self.teaserMode.autoplay) return;

            if (self.teaserEngine) {
              self.teaserEngine.pause();
              self.teaserEngine.seek(0);
            }

            if (self.ambientEngine && !self.ambientManuallyPaused) {
              self.ambientEngine.play();
            }
          });
        }

        function openTheater() {
          self._openTheater(self.teaserPanel, self.teaserMount, self.teaserEngine, {
            onClose: function () {
              self.removeAttribute('data-hover');
              self.teaserPanel.classList.remove('is-hover');
              if (self.teaserEngine) {
                self.teaserEngine.pause();
                self.teaserEngine.seek(0);
              }
              if (self.ambientEngine && !self.ambientManuallyPaused && !self.reduceMotion) {
                self.ambientEngine.play();
              }
            },
          });
        }

        if (cta) cta.addEventListener('click', openTheater);
        if (media) {
          media.addEventListener('click', function (event) {
            if (cta && cta.contains(event.target)) return;
            openTheater();
          });
        }

        this._setupTeaserEngine();
      }

      // (Re)build the teaser for the current breakpoint's mount. On touch it
      // autoplays in view; on desktop the engine stays lazy (created on hover).
      _setupTeaserEngine() {
        var self = this;

        if (this._teaserObserver) {
          this._teaserObserver.disconnect();
          this._teaserObserver = null;
        }
        if (this.teaserEngine) {
          this.teaserEngine.destroy();
          this.teaserEngine = null;
        }
        this.teaserPanel.classList.remove('is-playing', 'is-revealed', 'is-hover');
        this.removeAttribute('data-hover');

        this.teaserMount = pickMount(this.teaserPanel);

        // Mobile / touch (no hover): autoplay muted + looped, in view only (so
        // it doesn't contend with the other section's video on load). Skipped
        // for layout "first" (teaser hidden on mobile) and reduced motion.
        if (!hasHoverInput() && !this.reduceMotion && this.teaserMode.autoplay && this.layoutRule !== 'first') {
          this._teaserObserver = autoplayInView(this.teaserPanel, {
            shouldPlay: function () {
              return !self.teaserManuallyPaused;
            },
            play: function () {
              self._teaserEnsureEngine().then(function (engine) {
                if (!engine) return;
                engine.setMuted(true);
                engine.play();
              });
            },
            pause: function () {
              if (self.teaserEngine) self.teaserEngine.pause();
            },
          });
        }
      }

      _openTheater(panel, mount, engine, options) {
        if (!mount || !this.theater) return;
        options = options || {};
        if (engine) engine.pause();

        var cta = panel.querySelector('[data-dhv-open-theater]');
        // Read the mode from the panel being opened, so one video can wait for
        // a press in fullscreen while the other starts on its own.
        var mode = this._readPanelMode(panel);

        // Fullscreen always starts from the beginning, in both modes. The
        // panel behind it is a teaser, so resuming its position would drop the
        // viewer into an arbitrary mid-point of the film.
        this.theater.open(mount, {
          title: cta ? cta.dataset.title : '',
          duration: cta ? cta.dataset.duration : '',
          startTime: 0,
          waitForPress: mode.showPlayButton,
          onClose: options.onClose,
        });
      }
    }
  );
})();