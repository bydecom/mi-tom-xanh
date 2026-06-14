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

  // ── HEADER SCROLL SHRINK ─────────────────────────────
  const siteHeader = document.getElementById('site-header');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      siteHeader.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

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

    // Chỉ hiện thanh trượt sau khi video kết thúc
    if (landingVideo) {
      if (landingVideo.ended) {
        track.classList.add('show-bar');
      } else {
        landingVideo.addEventListener('ended', () => {
          track.classList.add('show-bar');
        });
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

  // ── SCROLL-SPY: Active navigation indicators ────────
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
          navLinksList.forEach(link => {
            const href = link.getAttribute("href").substring(1);
            link.classList.toggle("active", href === id);
          });
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
        // Vào viewport: chỉ play nếu video chưa kết thúc
        if (!vid.ended) {
          vid.play().catch(e => console.warn("Video auto-play prevented:", e));
        }
        if (parent) parent.classList.add('video-playing');
      } else {
        // Ra khỏi viewport: chỉ pause, không reset, giữ nguyên trạng thái
        if (!vid.ended) {
          vid.pause();
        }
      }
    });
  }, { threshold: 0.4 });

  videosToPlayOnScroll.forEach(id => {
    const vid = document.getElementById(id);
    if (vid) videoObserver.observe(vid);
  });

  // ── SECTION 11 SYNC VIDEO PLAYBACK ──────────────────
  const s11Section = document.getElementById('s11-new');
  const videoS11Top = document.getElementById('video-s11');
  const videoS11Bottom = document.getElementById('video-s11-bottom');

  if (s11Section && (videoS11Top || videoS11Bottom)) {
    const s11Observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Resume nếu chưa xong
          if (videoS11Top && !videoS11Top.ended) videoS11Top.play().catch(e => console.warn("videoS11Top play prevented:", e));
          if (videoS11Bottom && !videoS11Bottom.ended) videoS11Bottom.play().catch(e => console.warn("videoS11Bottom play prevented:", e));
          if (s11Section) s11Section.classList.add('video-playing');
        } else {
          // Pause khi scroll away, không reset
          if (videoS11Top && !videoS11Top.ended) videoS11Top.pause();
          if (videoS11Bottom && !videoS11Bottom.ended) videoS11Bottom.pause();
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

    const triggerS09Slide = () => {
      if (s09Triggered) return;
      s09Triggered = true;

      // 1. Cho cái nón lắc lư (wobble)
      s09Slider.classList.add('wobbling');

      // 2. Sau 1 giây lắc lư, tự động bay lên vị trí B
      setTimeout(() => {
        s09Slider.classList.remove('wobbling');
        s09Section.classList.add('slided');

        // 3. Đợi trượt xong (1s) rồi bật video
        setTimeout(() => {
          s09Section.classList.add('video-playing');
          s09Video.play().catch(e => console.warn("Video play error:", e));
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
          if (s09Section.classList.contains('video-playing') && !s09Video.ended) {
            s09Video.play().catch(e => console.warn("Video play error:", e));
          }
        } else {
          // Pause khi scroll away, không reset
          if (!s09Video.ended) s09Video.pause();
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
      const sectionPlaying = s07Section?.classList.contains('video-playing');
      if (sectionPlaying) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * s07Chars.length);
        } while (randomIndex === lastJumpedIndex && s07Chars.length > 1);

        lastJumpedIndex = randomIndex;
        const char = s07Chars[randomIndex];

        if (!char.classList.contains('jumping')) {
          char.classList.add('jumping');

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
    }
  }
};
