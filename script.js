document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("[data-section]");
  const preloader = document.getElementById("preloader");
  const progressBar = document.querySelector(".preloader-progress");
  const statusText = document.querySelector(".preloader-status");

  let loadedCount = 0;
  const totalSections = sections.length;

  // Function to load a section via Fetch API
  const loadSection = async (el) => {
    const sectionName = el.getAttribute("data-section");
    try {
      const response = await fetch(`${sectionName}.html`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const htmlText = await response.text();

      // Parse HTML text to insert elements
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlText.trim();
      const child = tempDiv.firstChild;

      // Replace placeholder with actual section
      el.parentNode.replaceChild(child, el);

      // Update progress
      loadedCount++;
      const progressPercent = Math.min((loadedCount / totalSections) * 100, 100);
      if (progressBar) progressBar.style.width = `${progressPercent}%`;
      if (statusText) statusText.textContent = `Đang tải phân đoạn ${loadedCount}/${totalSections}...`;

    } catch (err) {
      console.error(`Lỗi khi tải ${sectionName}:`, err);
      // Fallback in case of CORS or offline issues
      el.innerHTML = `
        <section class="section error-section">
          <div class="container">
            <p style="color: #ff6b6b; font-family: sans-serif; text-align: center; padding: 40px; border: 1px dashed #ff6b6b; border-radius: 4px;">
              Không thể tải <strong>${sectionName}.html</strong>.<br>
              <small>Lưu ý: Trình duyệt chặn tải file tĩnh khi mở trực tiếp file://. Vui lòng chạy qua Server cục bộ (Live Server) hoặc Python HTTP Server.</small>
            </p>
          </div>
        </section>
      `;
      loadedCount++;
    }
  };

  // Load all sections in sequence or parallel, then initialize interactions
  const initLoading = async () => {
    await Promise.all(Array.from(sections).map(loadSection));

    // Smooth transition to hide preloader
    setTimeout(() => {
      if (preloader) {
        preloader.classList.add("fade-out");
        setTimeout(() => {
          preloader.style.display = "none";
        }, 600);
      }

      // Initialize all interactive scripts
      initAppInteractions();
    }, 400);
  };

  initLoading();
});

/* =============================================
   APP INTERACTIONS (initialized after HTML load)
   ============================================= */
function initAppInteractions() {

  // ── AUDIO ELEMENTS ───────────────────────────────────
  const typingAudio = document.getElementById('audio-typing');

  // ── HEADER SCROLL SHRINK ─────────────────────────────
  const siteHeader = document.getElementById('site-header');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      siteHeader.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ── DISABLE IMAGE DRAG (toàn trang) ──────────────────
  document.querySelectorAll('img').forEach(img => {
    img.setAttribute('draggable', 'false');
  });

  // ── DỪNG TẤT CẢ VIDEO TẠI 4.3 GIÂY (tính là ended) ──
  const VIDEO_STOP_AT = 4.3; // ← Chỉnh thời điểm dừng ở đây (giây)

  document.querySelectorAll('video').forEach(vid => {
    vid.addEventListener('timeupdate', () => {
      if (!vid._stopped && vid.currentTime >= VIDEO_STOP_AT) {
        vid._stopped = true; // Đánh dấu video đã hoàn thành
        vid.pause();
        vid.currentTime = VIDEO_STOP_AT; // Đóng băng đúng frame

        // Dispatch 'ended' để trigger tất cả listener đang chờ event này
        vid.dispatchEvent(new Event('ended'));
      }
    });
  });

  // ── MOBILE NAV TOGGLE ────────────────────────────────
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const links = document.querySelectorAll(".nav-links a");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.classList.toggle("active", isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a link is clicked
    links.forEach(link => {
      link.addEventListener("click", () => {
        navToggle.classList.remove("active");
        navLinks.classList.remove("open");
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── GLOBAL CLICK / INTERACTION SOUND ─────────────────
  const interactionSound = new Audio('assets/section_6.m4a');
  interactionSound.preload = 'auto';

  window.playInteractionSound = () => {
    interactionSound.currentTime = 0;
    interactionSound.play().catch(err => console.warn("Interaction sound prevented:", err));
  };

  document.addEventListener('click', (e) => {
    // Phát hiện phần tử tương tác
    const isInteractive = e.target.closest('a, button, [class*="btn"], .s06-click-img, #drag-zone, .s10-btn, .s05-hotspot, .nav-link, .nav-toggle, #s09-slider');
    const isS07Game = e.target.closest('.s07-click-overlay'); // Trừ game section 7 ra vì có âm thanh riêng
    const isS06SlideBtn = e.target.closest('.s06-invisible-btn'); // Trừ nút chuyển slide section 6 vì có section_6_1.mp3 riêng
    if (isInteractive && !isS07Game && !isS06SlideBtn) {
      window.playInteractionSound();
    }
  });

  // ── HERO REVEAL SLIDER ─────────────────────────────
  const section = document.getElementById('s01-landing');
  const textLayer = document.getElementById('text-layer');
  const handle = document.getElementById('slider-handle-wrap');
  const dragZone = document.getElementById('drag-zone');
  const track = document.getElementById('bar-layer');
  const modelWrap = section ? section.querySelector('.model-3d-wrap') : null;
  const landingVideo = document.getElementById('landingVideo');
  let dragging = false;

  if (section && textLayer && handle && dragZone && track) {
    const step1 = textLayer.querySelector('.step-1');
    const step2 = textLayer.querySelector('.step-2');
    const step3 = textLayer.querySelector('.step-3');
    const step4 = textLayer.querySelector('.step-4');

    let currentStep = 1;

    const setPct = (x) => {
      const trackRect = track.getBoundingClientRect();
      let pct = ((x - trackRect.left) / trackRect.width) * 100;
      pct = Math.min(100, Math.max(0, pct));
      const val = pct.toFixed(1) + '%';
      textLayer.style.setProperty('--pct', val);
      handle.style.setProperty('--pct', val);

      if (step1) step1.classList.toggle('visible', pct >= 0 && pct < 25);
      if (step2) step2.classList.toggle('visible', pct >= 25 && pct < 50);
      if (step3) step3.classList.toggle('visible', pct >= 50 && pct < 75);
      if (step4) step4.classList.toggle('visible', pct >= 75);

      // Phát âm thanh khi đổi text
      let newStep = 1;
      if (pct >= 25 && pct < 50) newStep = 2;
      else if (pct >= 50 && pct < 75) newStep = 3;
      else if (pct >= 75) newStep = 4;

      if (newStep !== currentStep) {
        currentStep = newStep;
        if (window.playInteractionSound) window.playInteractionSound();
      }

      if (modelWrap) {
        if (pct >= 99) {
          modelWrap.classList.add('active');
        } else {
          modelWrap.classList.remove('active');
        }
      }
    };

    // Khởi tạo ở 0%
    const initPct = () => {
      const val = '0%';
      textLayer.style.setProperty('--pct', val);
      handle.style.setProperty('--pct', val);
      if (modelWrap) {
        modelWrap.classList.remove('active');
      }
    };

    // Đợi layout ổn định một chút rồi khởi tạo
    setTimeout(initPct, 100);
    window.addEventListener('resize', initPct);

    let isS01Visible = true;
    const s01Observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        isS01Visible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    s01Observer.observe(section);

    // Chỉ hiện thanh trượt sau khi video kết thúc
    if (landingVideo) {
      const showTrackAndAnimate = () => {
        // Khởi động lại animation để canh chuẩn xác thời gian phát âm thanh
        handle.style.animation = 'none';
        handle.offsetHeight; // trigger reflow
        handle.style.animation = null;
        track.classList.add('show-bar');

        // Trong CSS, animation nudge-right dài 4s, bắt đầu wobble ở 70% (tức 2.8s) và lắc lần hai ở 82.5% (tức 3.3s)
        const playWobbleSound = () => {
          // Chỉ phát âm thanh nếu section 1 đang hiển thị
          if (handle.classList.contains('nudge-anim') && isS01Visible) {
            if (window.playInteractionSound) window.playInteractionSound();

            // Lắc lần 2 sau 500ms
            setTimeout(() => {
              if (handle.classList.contains('nudge-anim') && isS01Visible) {
                if (window.playInteractionSound) window.playInteractionSound();
              }
            }, 500);
          }
        };

        // Wobble lần đầu
        setTimeout(playWobbleSound, 2800);

        // Các lần wobble tiếp theo (animation lặp lại mỗi 4s)
        handle.addEventListener('animationiteration', () => {
          setTimeout(playWobbleSound, 2800);
        });
      };

      if (landingVideo.ended) {
        showTrackAndAnimate();
      } else {
        landingVideo.addEventListener('ended', showTrackAndAnimate);
      }
    }

    handle.addEventListener('mousedown', e => {
      dragging = true;
      handle.classList.remove('nudge-anim');
    });

    document.addEventListener('mousemove', e => {
      if (dragging) setPct(e.clientX);
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });

    handle.addEventListener('touchstart', e => {
      dragging = true;
      handle.classList.remove('nudge-anim');
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (dragging) setPct(e.touches[0].clientX);
    }, { passive: true });

    document.addEventListener('touchend', () => {
      dragging = false;
    });
  }

  // ── AUDIO MANAGER ─────────────────────────────────────
  const audioMap = {
    's01-landing': 'audio-home',
    's03-craft': 'audio-home',
    's02-material': 'audio-material',
    's07-cta': 'audio-material',
    's08-new': 'audio-material',
    's09-new': 'audio-material',
    's04-voice': 'audio-story',
    's05-objects': 'audio-story',
    's06-impact': 'audio-story',
    's10-new': 'audio-impact',
    's11-new': 'audio-impact'
  };

  let currentAudioId = null;
  let userInteracted = false;

  const FADE_DURATION = 800; // 1 giây fade in/out
  const FADE_STEPS = 20;
  const FADE_INTERVAL = FADE_DURATION / FADE_STEPS;
  const MAX_VOLUME = 1.0; // Tăng âm lượng lên mức tối đa (100%) theo yêu cầu

  // Quản lý các interval fade để tránh đụng độ
  const fadeIntervals = new Map();

  const fadeAudio = (audio, direction) => {
    if (fadeIntervals.has(audio.id)) {
      clearInterval(fadeIntervals.get(audio.id));
    }

    const targetMaxVol = window._audioDimmed ? 0.1 : MAX_VOLUME;

    if (direction === 'in') {
      audio.volume = 0;
      audio.play().catch(e => console.warn("Audio play prevented:", e));

      let vol = 0;
      const interval = setInterval(() => {
        vol += targetMaxVol / FADE_STEPS;
        if (vol >= targetMaxVol) {
          vol = targetMaxVol;
          clearInterval(interval);
          fadeIntervals.delete(audio.id);
        }
        audio.volume = vol;
      }, FADE_INTERVAL);
      fadeIntervals.set(audio.id, interval);

    } else if (direction === 'out') {
      let vol = audio.volume;
      const interval = setInterval(() => {
        vol -= MAX_VOLUME / FADE_STEPS;
        if (vol <= 0) {
          vol = 0;
          clearInterval(interval);
          fadeIntervals.delete(audio.id);
          audio.pause();
          // LƯU Ý: Không reset audio.currentTime để lúc sau quay lại sẽ phát tiếp
        }
        audio.volume = vol;
      }, FADE_INTERVAL);
      fadeIntervals.set(audio.id, interval);
    }
  };

  window.setAudioDimmed = (dimmed) => {
    window._audioDimmed = dimmed;
    const targetVol = dimmed ? 0.1 : MAX_VOLUME;
    if (currentAudioId) {
      const audio = document.getElementById(currentAudioId);
      if (audio && !audio.paused) {
        if (fadeIntervals.has(audio.id)) {
          clearInterval(fadeIntervals.get(audio.id));
        }
        let vol = audio.volume;
        const step = 0.05;
        const interval = setInterval(() => {
          if (dimmed ? vol > targetVol : vol < targetVol) {
            vol += dimmed ? -step : step;
            // Kẹp giá trị
            if (vol < 0) vol = 0;
            if (vol > MAX_VOLUME) vol = MAX_VOLUME;
            audio.volume = vol;
          } else {
            audio.volume = targetVol;
            clearInterval(interval);
            fadeIntervals.delete(audio.id);
          }
        }, 50);
        fadeIntervals.set(audio.id, interval);
      }
    }
  };

  const playAudio = (audioId) => {
    if (!userInteracted || !audioId) return;

    // Fade out các audio khác đang phát
    document.querySelectorAll('audio').forEach(audio => {
      if (audio.id !== audioId && !audio.paused) {
        fadeAudio(audio, 'out');
      }
    });

    // Fade in audio mục tiêu
    const targetAudio = document.getElementById(audioId);
    if (targetAudio && targetAudio.paused) {
      fadeAudio(targetAudio, 'in');
    }
  };

  const handleAudioSwitch = (sectionId) => {
    const targetAudioId = audioMap[sectionId];
    if (targetAudioId && targetAudioId !== currentAudioId) {
      currentAudioId = targetAudioId;
      playAudio(currentAudioId);
    }
  };

  // User interaction unlocks audio playback
  const unlockAudio = () => {
    if (!userInteracted) {
      userInteracted = true;
      if (currentAudioId) {
        playAudio(currentAudioId);
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('scroll', unlockAudio); // Sometimes scrolling is counted
    }
  };

  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  document.addEventListener('scroll', unlockAudio, { once: true });

  // ── SCROLL-SPY: Active navigation indicators & Audio ────────
  const observedSections = document.querySelectorAll("main > section");
  const navLinksList = document.querySelectorAll(".nav-links a");

  if (navLinksList.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // High-accuracy window triggers
      threshold: 0
    };

    const scrollSpyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");

          // Update Nav Links
          navLinksList.forEach(link => {
            const href = link.getAttribute("href").substring(1);
            link.classList.toggle("active", href === id);
          });

          // Update Background Audio
          handleAudioSwitch(id);
        }
      });
    }, observerOptions);

    observedSections.forEach(section => {
      scrollSpyObserver.observe(section);
    });
  }

  // ── SECTION 6: SLIDESHOW ROUTING ─────────────────────
  window.routeSlide = function (index) {
    const slides = document.querySelectorAll('.s06-slide');
    const dots = document.querySelectorAll('.s06-invisible-btn');

    if (slides.length === 0 || dots.length === 0) return;

    // Bỏ active tất cả
    slides.forEach(slide => slide.classList.remove('active'));

    // Thêm active cho slide được chọn
    if (slides[index]) {
      slides[index].classList.add('active');

      // Lazy load cho iframe 3D (chỉ tải khi tab được bật)
      const iframe = slides[index].querySelector('iframe');
      if (iframe && iframe.src.includes('about:blank')) {
        const dataSrc = iframe.getAttribute('data-src');
        if (dataSrc) iframe.src = dataSrc;
      }

      // Phát âm thanh chuyển slide
      const s06SlideSound = document.getElementById('s06-slide-sound');
      if (s06SlideSound) {
        s06SlideSound.currentTime = 0; // Reset về 0 để phát ngay cả khi âm cũ chưa dứt
        s06SlideSound.play().catch(err => console.warn("S06 slide sound play prevented:", err));
      }
    }
  };

  // ── SECTION 11: SLIDESHOW ROUTING ────────────────────
  window.routeSlide11 = function (index) {
    const slides = document.querySelectorAll('.s11-slide');
    const dots = document.querySelectorAll('.s11-invisible-btn');

    if (slides.length === 0 || dots.length === 0) return;

    // Bỏ active tất cả
    slides.forEach(slide => slide.classList.remove('active'));
    // Thêm active cho slide được chọn
    if (slides[index]) slides[index].classList.add('active');
  };

  // ── SCROLL-REVEAL ANIMATIONS ─────────────────────────
  const revealElements = document.querySelectorAll(
    ".section-headline, .section-body, .impact-ring, .cycle-step"
  );

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target); // Trigger only once
      }
    });
  }, {
    root: null,
    threshold: 0.1
  });

  revealElements.forEach(el => {
    el.classList.add("reveal-init");
    revealObserver.observe(el);
  });

  // ── VIDEO PLAY ON SCROLL (SECTION 2, 3, 4, 5, 6, 7, 8, 10) ────
  const videosToPlayOnScroll = ["video-s02", "video-s03", "video-s04", "video-s05", "video-s06", "video-s07", "video-s08", "video-s10"];

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const vid = entry.target;
      const parent = vid.parentElement;

      if (entry.isIntersecting) {
        // Vào viewport: chỉ play nếu video chưa hoàn thành (chưa đạt 4.3s)
        if (!vid._stopped) {
          vid.play().catch(e => console.warn("Video auto-play prevented:", e));
        }
        if (parent) parent.classList.add('video-playing');
      } else {
        // Ra khỏi viewport: Cơ chế HARD bind -> không pause video nữa
        // Để nó chạy cho xong (tới mốc 4.3s tự dừng) để tránh lỗi đơ đứt quãng (Promise play bị reject)
      }
    });
  }, { threshold: 0.4 });

  videosToPlayOnScroll.forEach(id => {
    const vid = document.getElementById(id);
    if (vid) videoObserver.observe(vid);
  });

  const TYPING_START_AT = 0.8; // Skip khoảng lặng đầu
  const TYPING_STOP_AT = 2.5;  // Dừng typing sound tại 2.5 giây
  const typingSections = ['s01-landing', 's03-craft', 's04-voice', 's05-objects', 's06-impact', 's09-new', 's10-new', 's11-new'];

  // Mỗi section có Audio object RIÊNG — hoàn toàn độc lập, không tranh nhau
  const typingAudioSrc = document.getElementById('audio-typing')?.src || 'assets/typing.mp3';

  const typingInstances = {};
  typingSections.forEach(id => {
    const audio = new Audio(typingAudioSrc);
    audio.preload = 'auto';
    audio.currentTime = TYPING_START_AT;

    // Tự dừng tại 2.5s và đánh dấu completed
    audio.addEventListener('timeupdate', () => {
      if (!audio._completed && audio.currentTime >= TYPING_STOP_AT) {
        audio.pause();
        audio.currentTime = TYPING_STOP_AT;
        audio._completed = true;
      }
    });

    typingInstances[id] = audio;
  });

  const typingDirectSections = ['s01-landing', 's03-craft', 's04-voice', 's05-objects', 's06-impact', 's10-new', 's11-new'];
  typingDirectSections.forEach(id => {
    if (typingInstances[id]) typingInstances[id]._canPlay = true;
  });

  const typingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      const audio = typingInstances[id];
      if (!audio) return;

      if (entry.isIntersecting) {
        if (audio._completed || !audio._canPlay) return; // Đã xong hoặc chưa cấp quyền → bỏ qua
        audio.play().catch(e => console.warn(`Typing SFX prevented for ${id}:`, e));
      } else {
        if (!audio._completed && !audio.paused) {
          audio.pause(); // Pause + giữ nguyên vị trí để resume sau
        }
      }
    });
  }, { threshold: 0.3 });

  // Đảm bảo DOM load đủ rồi mới observe
  setTimeout(() => {
    typingSections.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        typingObserver.observe(section);
      } else {
        console.warn('Typing SFX: Không tìm thấy section', id);
      }
    });
  }, 500);

  // ── DRAWING SOUND ─────────────────────────────────────
  // Sections có drawing: 2, 3, 4, 5, 7, 8, 9, 10
  const drawingAudioSrc = document.getElementById('audio-drawing')?.src || 'assets/drawing.mp3';
  const drawingSections = ['s02-material', 's03-craft', 's04-voice', 's05-objects', 's07-cta', 's08-new', 's09-new', 's10-new'];

  const drawingInstances = {};
  drawingSections.forEach(id => {
    const audio = new Audio(drawingAudioSrc);
    audio.preload = 'auto';

    // Đánh dấu completed khi play hết file gốc
    audio.addEventListener('ended', () => {
      audio._completed = true;
    });

    // Giới hạn thời gian play tối đa 1 giây
    audio.addEventListener('timeupdate', () => {
      if (!audio._completed && audio.currentTime >= 1.5) {
        audio.pause();
        audio._completed = true;
      }
    });

    drawingInstances[id] = audio;
  });

  // Default: các section này được phép play drawing ngay lập tức khi vào viewport
  const drawingDirectSections = ['s02-material', 's04-voice', 's05-objects', 's07-cta', 's08-new', 's10-new'];
  drawingDirectSections.forEach(id => {
    if (drawingInstances[id]) drawingInstances[id]._canPlay = true;
  });

  const drawingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      const audio = drawingInstances[id];
      if (!audio) return;

      if (entry.isIntersecting) {
        // Chỉ play nếu đã được cấp quyền (_canPlay) và chưa chạy xong
        if (audio._completed || !audio._canPlay) return;
        audio.play().catch(e => console.warn(`Drawing SFX prevented for ${id}:`, e));
      } else {
        if (!audio._completed && !audio.paused) {
          audio.pause(); // Pause khi scroll ra khỏi màn hình
        }
      }
    });
  }, { threshold: 0.3 });

  // Section 3: Cấp quyền play drawing SAU KHI typing xong
  const typingS03 = typingInstances['s03-craft'];
  if (typingS03) {
    typingS03.addEventListener('timeupdate', () => {
      if (typingS03._completed && drawingInstances['s03-craft'] && !drawingInstances['s03-craft']._canPlay) {
        drawingInstances['s03-craft']._canPlay = true;

        // Nếu section vẫn đang trên màn hình (chưa bị cuộn đi), play luôn
        const s03Element = document.getElementById('s03-craft');
        const rect = s03Element?.getBoundingClientRect();
        if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
          drawingInstances['s03-craft'].play().catch(e => console.warn('Drawing s03 prevented:', e));
        }
      }
    });
  }

  // Section 9: Expose hàm để cấp quyền play drawing/typing sau khi nón bay xong
  window._playDrawingS09 = () => {
    const drawing = drawingInstances['s09-new'];
    if (drawing && !drawing._completed && !drawing._canPlay) {
      drawing._canPlay = true;
      drawing.play().catch(e => console.warn('Drawing s09 prevented:', e));
    }
    const typing = typingInstances['s09-new'];
    if (typing && !typing._completed && !typing._canPlay) {
      typing._canPlay = true;
      typing.play().catch(e => console.warn('Typing s09 prevented:', e));
    }
  };

  // Đăng ký observe tất cả các section có drawing
  setTimeout(() => {
    drawingSections.forEach(id => {
      const section = document.getElementById(id);
      if (section) drawingObserver.observe(section);
    });
  }, 500);

  // ── SECTION 11 SYNC VIDEO PLAYBACK ──────────────────
  const s11Section = document.getElementById('s11-new');
  const videoS11Top = document.getElementById('video-s11');
  const videoS11Bottom = document.getElementById('video-s11-bottom');

  if (s11Section && (videoS11Top || videoS11Bottom)) {
    const s11Observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Resume nếu chưa xong
          if (videoS11Top && !videoS11Top._stopped) videoS11Top.play().catch(e => console.warn("videoS11Top play prevented:", e));
          if (videoS11Bottom && !videoS11Bottom._stopped) videoS11Bottom.play().catch(e => console.warn("videoS11Bottom play prevented:", e));
          if (s11Section) s11Section.classList.add('video-playing');
        } else {
          // Ra khỏi viewport: Cơ chế HARD bind -> không pause video nữa
        }
      });
    }, { threshold: 0.3 });
    s11Observer.observe(s11Section);
  }

  // ── DROPDOWNS SECTION 2 ──────────────────────────────
  const hoverZone = document.getElementById('s02-hover-zone');
  const dropdownMain = document.getElementById('dropdown-main');
  const videoS02 = document.getElementById('video-s02');

  // dropdown-main xuất hiện và giữ cố định (không biến mất)
  if (dropdownMain) {
    const showDropdownMain = () => {
      dropdownMain.classList.add('show');
    };

    if (hoverZone) {
      hoverZone.addEventListener('mouseenter', showDropdownMain);
      hoverZone.addEventListener('click', showDropdownMain);
    }

    if (videoS02) {
      videoS02.addEventListener('ended', showDropdownMain);
      if (videoS02.parentElement && videoS02.parentElement.classList.contains('video-ended')) {
        showDropdownMain();
      }
    }
  }

  // dropdown_1, 2, 3, 4 xuất hiện ngay con trỏ chuột khi hover
  [1, 2, 3, 4].forEach((index) => {
    const tooltip = document.getElementById(`dropdown-${index}`);
    const btn = document.querySelector(`.s02-btn.btn-${index}`);
    const label = document.querySelector(`.s02-label.label-${index}`);

    if (tooltip) {
      const showTooltip = (e) => {
        const tooltipWidth = 380;
        const margin = 15;
        let posX = e.clientX;
        const minX = tooltipWidth / 2 + margin;
        const maxX = window.innerWidth - (tooltipWidth / 2 + margin);
        posX = Math.max(minX, Math.min(posX, maxX));

        tooltip.style.left = `${posX}px`;
        tooltip.style.top = `${e.clientY}px`;

        const tooltipHeight = tooltip.offsetHeight || 150;
        const isTooHigh = e.clientY < (tooltipHeight + 30);

        if (isTooHigh) {
          tooltip.style.transform = 'translate(-50%, 8px) scale(1)';
        } else {
          tooltip.style.transform = 'translate(-50%, calc(-100% - 8px)) scale(1)';
        }
        tooltip.classList.add('show');
      };

      const moveTooltip = (e) => {
        const tooltipWidth = 380;
        const margin = 15;
        let posX = e.clientX;
        const minX = tooltipWidth / 2 + margin;
        const maxX = window.innerWidth - (tooltipWidth / 2 + margin);
        posX = Math.max(minX, Math.min(posX, maxX));

        tooltip.style.left = `${posX}px`;
        tooltip.style.top = `${e.clientY}px`;

        const tooltipHeight = tooltip.offsetHeight || 150;
        const isTooHigh = e.clientY < (tooltipHeight + 30);

        if (isTooHigh) {
          tooltip.style.transform = 'translate(-50%, 8px) scale(1)';
        } else {
          tooltip.style.transform = 'translate(-50%, calc(-100% - 8px)) scale(1)';
        }
      };

      const hideTooltip = () => {
        tooltip.classList.remove('show');
        const currentTransform = tooltip.style.transform;
        if (currentTransform) {
          tooltip.style.transform = currentTransform.replace('scale(1)', 'scale(0.8)');
        }
      };

      [btn, label].forEach(el => {
        if (el) {
          el.addEventListener('mouseenter', showTooltip);
          el.addEventListener('mousemove', moveTooltip);
          el.addEventListener('mouseleave', hideTooltip);
        }
      });
    }
  });

  // ── SECTION 9 SLIDER ─────────────────────────────────
  const s09Slider = document.getElementById('s09-slider');
  const s09Section = document.getElementById('s09-new');
  const s09Video = document.getElementById('video-s09');

  if (s09Slider && s09Section && s09Video) {
    let s09Triggered = false;
    const s09FlyAudio = new Audio('assets/fly.m4a');
    s09FlyAudio.preload = 'auto';

    const triggerS09Slide = () => {
      if (s09Triggered) return;
      s09Triggered = true;

      // 1. Cho cái nón lắc lư (wobble)
      s09Slider.classList.add('wobbling');

      // 2. Sau 1 giây lắc lư, tự động bay lên vị trí B
      setTimeout(() => {
        s09Slider.classList.remove('wobbling');
        s09Section.classList.add('slided');

        // Phát âm thanh tiếng bay lên
        s09FlyAudio.currentTime = 0;
        s09FlyAudio.play().catch(e => console.warn('Fly audio prevented:', e));

        // 3. Đợi trượt xong (1s) rồi bật video + drawing sound
        setTimeout(() => {
          s09Section.classList.add('video-playing');
          s09Video.play().catch(e => console.warn("Video play error:", e));
          // Drawing sound bắt đầu sau khi nón bay lên xong
          if (window._playDrawingS09) window._playDrawingS09();
        }, 1000);
      }, 1000);
    };

    // Vẫn giữ click để kích hoạt thủ công nếu cần
    s09Slider.addEventListener('click', triggerS09Slide);

    // Trigger 1 lần khi vào viewport; pause/resume nếu đang phát dở
    const s09Observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Trigger animation lần đầu
          if (!s09Triggered) triggerS09Slide();
          // Resume video nếu đang phát dở
          if (s09Section.classList.contains('video-playing') && !s09Video._stopped) {
            s09Video.play().catch(e => console.warn("Video play error:", e));
          }
        } else {
          // Ra khỏi viewport: Cơ chế HARD bind -> không pause video nữa
        }
      });
    }, {
      threshold: 0.5
    });

    s09Observer.observe(s09Section);
  }

  // ── SECTION 8 SLIDE IMAGES ───────────────────────────
  const s08BtnUpper = document.querySelector('.s08-btn-upper');
  const s08BtnLower = document.querySelector('.s08-btn-lower');
  const s08ImgUpper = document.getElementById('s08-img-upper');
  const s08ImgLower = document.getElementById('s08-img-lower');

  if (s08BtnUpper && s08ImgUpper) {
    s08BtnUpper.addEventListener('click', () => {
      s08ImgUpper.classList.toggle('show');
    });
  }

  if (s08BtnLower && s08ImgLower) {
    s08BtnLower.addEventListener('click', () => {
      s08ImgLower.classList.toggle('show');
    });
  }

  // ── SECTION 7 JUMPING CHARACTERS ─────────────────────
  const s07Chars = document.querySelectorAll('.s07-char');
  if (s07Chars.length > 0) {
    // Khởi tạo audio cho nhảy và click điểm
    const jumpAudio = new Audio('assets/jumping.m4a');
    jumpAudio.preload = 'auto';
    const scoreAudio = new Audio('assets/score.mp3');
    scoreAudio.preload = 'auto';
    const failAudio = new Audio('assets/fail.mp3');
    failAudio.preload = 'auto';

    // Khởi tạo trạng thái vị trí ban đầu của 4 nhân vật (theo %)
    const positions = [
      { left: 74, top: 75 },
      { left: 79, top: 75 },
      { left: 84, top: 75 },
      { left: 89, top: 75 }
    ];

    let score = 0;
    const scoreBoard = document.getElementById('s07-score-board');
    const scoreVal = document.getElementById('s07-score-val');
    const s07Section = document.getElementById('s07-cta');

    // Theo dõi xem section 7 có đang trên màn hình hay không
    let isS07Visible = false;
    if (s07Section) {
      const s07VisibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isS07Visible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      s07VisibilityObserver.observe(s07Section);

      // Lắng nghe click toàn bộ section 7, nếu không phải click vào mục tiêu thì tính là bấm hụt
      s07Section.addEventListener('click', (e) => {
        if (!e.target.closest('.s07-click-overlay')) {
          failAudio.currentTime = 0;
          failAudio.play().catch(e => console.warn('Fail audio prevented:', e));
        }
      });
    }

    // Hàm cộng điểm dùng chung
    const addScore = () => {
      score++;
      if (scoreVal) scoreVal.textContent = score;
      if (scoreBoard) {
        if (score === 1) scoreBoard.classList.add('show-score');
        scoreBoard.classList.remove('bounce-score');
        void scoreBoard.offsetWidth;
        scoreBoard.classList.add('bounce-score');
      }
    };

    let lastJumpedIndex = -1;

    // Lâu lâu tưng lên 1 cái (random 1 trong 4 con, không lặp lại liên tiếp)
    const triggerRandomJump = () => {
      // Chỉ trigger khi section 7 đang hiển thị trên màn hình
      if (isS07Visible) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * s07Chars.length);
        } while (randomIndex === lastJumpedIndex && s07Chars.length > 1);

        lastJumpedIndex = randomIndex;
        const char = s07Chars[randomIndex];

        if (!char.classList.contains('jumping')) {
          char.classList.add('jumping');

          // Phát âm thanh nhảy
          jumpAudio.currentTime = 0;
          jumpAudio.play().catch(e => console.warn('Jump audio prevented:', e));

          // Tạo overlay click đúng vị trí nhân vật đang hiển thị khi nhảy lên
          // (hitbox của char nằm ở vị trí gốc, không dịch chuyển theo animation)
          const charRect = char.getBoundingClientRect();
          const sectionRect = s07Section.getBoundingClientRect();

          // Tính % vị trí của char so với section (vị trí hiện tại trước khi nhảy)
          const charCenterX = char.offsetLeft;
          const charCenterY = char.offsetTop;

          // Chiều cao nhảy lên ~ 40% chiều cao của char (theo keyframe translate -90% → -50% = 40% diff)
          const jumpOffsetPx = char.offsetHeight * 0.4;

          const overlay = document.createElement('div');
          overlay.classList.add('s07-click-overlay');
          overlay.style.cssText = `
            position: absolute;
            left: ${charCenterX}px;
            top: ${charCenterY - jumpOffsetPx}px;
            width: ${char.offsetWidth}px;
            height: ${char.offsetHeight}px;
            transform: translate(-50%, -50%);
            z-index: 20;
            cursor: pointer;
            background: transparent;
            pointer-events: auto;
          `;

          let scored = false;
          overlay.addEventListener('click', () => {
            if (!scored) {
              scored = true;
              addScore();

              // Phát âm thanh ghi điểm
              scoreAudio.currentTime = 0;
              scoreAudio.play().catch(e => console.warn('Score audio prevented:', e));
            }
          });

          s07Section.appendChild(overlay);

          // Xóa overlay khi animation kết thúc
          char.addEventListener('animationend', () => {
            char.classList.remove('jumping');
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          }, { once: true });
        }
      }

      const randomDelay = 1000 + Math.random() * 1500; // Random từ 1s đến 2.5s
      setTimeout(triggerRandomJump, randomDelay);
    };

    setTimeout(triggerRandomJump, 1500);
  }

  // ── SECTION 10: HOVER TOOLTIP IMAGE ──────────────────
  const s10Btns = document.querySelectorAll('.s10-btn');
  const s10Tooltip = document.getElementById('s10-hover-tooltip');

  if (s10Btns.length > 0 && s10Tooltip) {
    s10Btns.forEach(btn => {
      const showTooltip = (e) => {
        const hoverImg = btn.getAttribute('data-hover-img');
        if (hoverImg) {
          s10Tooltip.src = hoverImg;

          const tooltipWidth = 300;
          const margin = 15;
          let posX = e.clientX;
          const minX = tooltipWidth / 2 + margin;
          const maxX = window.innerWidth - (tooltipWidth / 2 + margin);
          posX = Math.max(minX, Math.min(posX, maxX));

          s10Tooltip.style.left = `${posX}px`;
          s10Tooltip.style.top = `${e.clientY}px`;

          const tooltipHeight = s10Tooltip.offsetHeight || 200;
          const isTooHigh = e.clientY < (tooltipHeight + 30);

          if (isTooHigh) {
            s10Tooltip.style.transform = 'translate(-50%, 8px) scale(1)';
          } else {
            s10Tooltip.style.transform = 'translate(-50%, calc(-100% - 8px)) scale(1)';
          }

          s10Tooltip.classList.add('show');
        }
      };

      const moveTooltip = (e) => {
        const tooltipWidth = 300;
        const margin = 15;
        let posX = e.clientX;
        const minX = tooltipWidth / 2 + margin;
        const maxX = window.innerWidth - (tooltipWidth / 2 + margin);
        posX = Math.max(minX, Math.min(posX, maxX));

        s10Tooltip.style.left = `${posX}px`;
        s10Tooltip.style.top = `${e.clientY}px`;

        const tooltipHeight = s10Tooltip.offsetHeight || 200;
        const isTooHigh = e.clientY < (tooltipHeight + 30);

        if (isTooHigh) {
          s10Tooltip.style.transform = 'translate(-50%, 8px) scale(1)';
        } else {
          s10Tooltip.style.transform = 'translate(-50%, calc(-100% - 8px)) scale(1)';
        }
      };

      const hideTooltip = () => {
        s10Tooltip.classList.remove('show');
        const currentTransform = s10Tooltip.style.transform;
        if (currentTransform) {
          s10Tooltip.style.transform = currentTransform.replace('scale(1)', 'scale(0.8)');
        }
      };

      btn.addEventListener('mouseenter', showTooltip);
      btn.addEventListener('mousemove', moveTooltip);
      btn.addEventListener('mouseleave', hideTooltip);
    });
  }

  // ── SECTION 11: SHOW FACEBOOK LINK AFTER VIDEO ENDS ──
  const videoS11 = document.getElementById('video-s11');
  const s11FbBtn = document.querySelector('.s11-fb-btn');
  if (videoS11 && s11FbBtn) {
    videoS11.addEventListener('ended', () => {
      s11FbBtn.classList.add('show-btn');
    });
  }

};

// ── VIDEO MODAL (SECTION 5) ──────────────────────────
window.openVideoModal = function (videoId) {
  const modal = document.getElementById('video-modal');
  const iframe = document.getElementById('youtube-iframe');
  if (modal && iframe) {
    // Nhúng link Youtube có tự động bật (autoplay)
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.add('show');

    // Giảm âm lượng nhạc nền xuống 10%
    if (window.setAudioDimmed) window.setAudioDimmed(true);
  }
};

window.closeVideoModal = function (event) {
  // Chỉ đóng nếu click vào nền mờ hoặc nút X
  if (event.target.classList.contains('video-modal') || event.target.classList.contains('video-close-btn')) {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('youtube-iframe');
    if (modal && iframe) {
      modal.classList.remove('show');
      // Tắt video khi đóng popup để không bị phát tiếng nền
      setTimeout(() => {
        iframe.src = '';
      }, 300);

      // Khôi phục lại âm lượng nhạc nền
      if (window.setAudioDimmed) window.setAudioDimmed(false);
    }
  }
};
