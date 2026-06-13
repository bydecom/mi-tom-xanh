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

  // ── MOBILE NAV TOGGLE ────────────────────────────
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav-links");
  const links = document.querySelectorAll(".nav-links a");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active");
      navLinks.classList.toggle("open");
    });

    // Close menu when a link is clicked
    links.forEach(link => {
      link.addEventListener("click", () => {
        navToggle.classList.remove("active");
        navLinks.classList.remove("open");
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

    handle.addEventListener('mousedown', e => {
      dragging = true;
    });

    document.addEventListener('mousemove', e => {
      if (dragging) setPct(e.clientX);
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });

    handle.addEventListener('touchstart', e => {
      dragging = true;
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

  // ── VIDEO PLAY ON SCROLL (SECTION 2, 3, 4, 5, 6, 7, 8, 10, 11) ────
  const videosToPlayOnScroll = ["video-s02", "video-s03", "video-s04", "video-s05", "video-s06", "video-s07", "video-s08", "video-s10", "video-s11"];
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.play().catch(e => console.warn("Video auto-play prevented:", e));
        if (entry.target.parentElement) {
          entry.target.parentElement.classList.add('video-playing');
        }
        videoObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  videosToPlayOnScroll.forEach(id => {
    const vid = document.getElementById(id);
    if (vid) videoObserver.observe(vid);
  });

  // ── DROPDOWNS SECTION 2 ──────────────────────────────
  const s02Btns = document.querySelectorAll('.s02-btn');
  const hoverZone = document.getElementById('s02-hover-zone');
  const dropdowns = document.querySelectorAll('.s02-dropdown');

  const closeAllDropdowns = () => {
    dropdowns.forEach(d => d.classList.remove('show'));
  };

  // Cài đặt click cho cả nút và chữ
  [1, 2, 3, 4].forEach((index) => {
    const handleToggle = (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById(`dropdown-${index}`);
      if (dropdown) {
        const isActive = dropdown.classList.contains('show');
        closeAllDropdowns();
        if (!isActive) dropdown.classList.add('show');
      }
    };

    const btn = document.querySelector(`.s02-btn.btn-${index}`);
    const label = document.querySelector(`.s02-label.label-${index}`);

    if (btn) btn.addEventListener('click', handleToggle);
    if (label) label.addEventListener('click', handleToggle);
  });

  if (hoverZone) {
    hoverZone.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('dropdown-main');
      if (dropdown) {
        const isActive = dropdown.classList.contains('show');
        closeAllDropdowns();
        if (!isActive) dropdown.classList.add('show');
      }
    });
  }

  // Click ra ngoài thì đóng hết dropdowns
  document.addEventListener('click', () => {
    closeAllDropdowns();
  });

  // ── SECTION 9 SLIDER ─────────────────────────────────
  const s09Slider = document.getElementById('s09-slider');
  const s09Section = document.getElementById('s09-new');
  const s09Video = document.getElementById('video-s09');

  if (s09Slider && s09Section && s09Video) {
    s09Slider.addEventListener('click', () => {
      // 1. Chuyển nút sang vị trí B
      s09Section.classList.add('slided');

      // 2. Đợi trượt xong (1s = 1000ms) rồi bật video
      setTimeout(() => {
        s09Section.classList.add('video-playing');
        s09Video.play().catch(e => console.warn("Video play error:", e));
      }, 1000);
    });
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

    s07Chars.forEach((char, index) => {
      char.addEventListener('click', () => {
        let newLeft, newTop;
        let attempts = 0;
        let isOverlapping = true;

        // Vòng lặp tìm vị trí mới không bị đè lên các nhân vật khác
        do {
          newLeft = 10 + Math.random() * 80; // Tránh mép màn hình (10% - 90%)
          newTop = 15 + Math.random() * 70;  // (15% - 85%)

          isOverlapping = false;
          for (let i = 0; i < positions.length; i++) {
            if (i === index) continue; // Không tự so với chính mình
            const dx = newLeft - positions[i].left;
            const dy = newTop - positions[i].top;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Khoảng cách an toàn là 22% để không đè lên nhau
            if (dist < 22) {
              isOverlapping = true;
              break;
            }
          }
          attempts++;
        } while (isOverlapping && attempts < 100);

        // Cập nhật mảng vị trí và style
        positions[index] = { left: newLeft, top: newTop };
        char.style.left = `${newLeft}%`;
        char.style.top = `${newTop}%`;
      });
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
