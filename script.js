/* =========================================================
   DRUZZ MD — script.js
   ========================================================= */
(() => {
  "use strict";

  /* ---------------------------------------------------------
     CONFIG
     Change API_BASE_URL if the website is hosted separately
     from the DRUZZ MD backend (e.g. "https://api.yourdomain.com").
     Leave empty to call same-origin relative endpoints.
  --------------------------------------------------------- */
  const API_BASE_URL = window.DRUZZ_API_BASE || "druzz-md-bot.up.railway.app";
  const STATUS_POLL_INTERVAL_MS = 3000;
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     DISABLE ZOOM
  --------------------------------------------------------- */
  (function disableZoom() {
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    document.addEventListener("gesturechange", (e) => e.preventDefault());
    document.addEventListener("gestureend", (e) => e.preventDefault());

    document.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey) e.preventDefault();
      },
      { passive: false }
    );

    document.addEventListener("keydown", (e) => {
      const zoomKeys = ["=", "+", "-", "_", "0"];
      if ((e.ctrlKey || e.metaKey) && zoomKeys.includes(e.key)) {
        e.preventDefault();
      }
    });

    document.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches && e.touches.length > 1) e.preventDefault();
      },
      { passive: false }
    );

    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
      },
      { passive: false }
    );
  })();

  /* ---------------------------------------------------------
     LOADER
  --------------------------------------------------------- */
  (function loader() {
    const loaderEl = document.getElementById("loader");
    const fillEl = document.getElementById("loaderFill");
    if (!loaderEl || !fillEl) return;

    let progress = 0;
    const tick = () => {
      progress += Math.random() * 18;
      if (progress > 92) progress = 92;
      fillEl.style.width = progress + "%";
    };
    const interval = setInterval(tick, 160);

    const finish = () => {
      clearInterval(interval);
      fillEl.style.width = "100%";
      setTimeout(() => {
        loaderEl.classList.add("is-hidden");
        document.body.style.overflow = "";
      }, 320);
    };

    document.body.style.overflow = "hidden";
    const minTime = new Promise((r) => setTimeout(r, 900));
    const pageLoad = new Promise((r) => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", r, { once: true });
    });
    Promise.all([minTime, pageLoad]).then(finish);
  })();

  /* ---------------------------------------------------------
     PARTICLES CANVAS
  --------------------------------------------------------- */
  (function particles() {
    const canvas = document.getElementById("particles");
    if (!canvas || REDUCED_MOTION) return;
    const ctx = canvas.getContext("2d");
    let width, height, dpr;
    let points = [];

    const COLORS = ["23,233,160", "124,92,252"];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(70, Math.round((width * height) / 22000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},0.55)`;
        ctx.fill();
      }

      const maxDist = 130;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(23,233,160,${0.12 * (1 - dist / maxDist)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(step);
  })();

  /* ---------------------------------------------------------
     NAVBAR — scroll state, mobile toggle, active link
  --------------------------------------------------------- */
  (function navbar() {
    const navbarEl = document.getElementById("navbar");
    const toggleBtn = document.getElementById("navToggle");
    const navLinksEl = document.getElementById("navLinks");
    const links = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("main section[id], .hero[id]");

    if (!navbarEl) return;

    window.addEventListener(
      "scroll",
      () => {
        navbarEl.classList.toggle("is-scrolled", window.scrollY > 12);
      },
      { passive: true }
    );

    if (toggleBtn && navLinksEl) {
      toggleBtn.addEventListener("click", () => {
        const isOpen = navLinksEl.classList.toggle("is-open");
        toggleBtn.classList.toggle("is-open", isOpen);
        toggleBtn.setAttribute("aria-expanded", String(isOpen));
      });

      navLinksEl.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          navLinksEl.classList.remove("is-open");
          toggleBtn.classList.remove("is-open");
          toggleBtn.setAttribute("aria-expanded", "false");
        });
      });
    }

    if ("IntersectionObserver" in window && sections.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("id");
              links.forEach((link) => {
                link.classList.toggle("active", link.getAttribute("href") === "#" + id);
              });
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      sections.forEach((s) => observer.observe(s));
    }
  })();

  /* ---------------------------------------------------------
     SCROLL REVEAL
  --------------------------------------------------------- */
  (function reveal() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (REDUCED_MOTION || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => observer.observe(t));
  })();

  /* ---------------------------------------------------------
     TOASTS
  --------------------------------------------------------- */
  const Toast = (() => {
    const container = document.getElementById("toastContainer");
    const icons = {
      success: "fa-solid fa-circle-check",
      error: "fa-solid fa-circle-exclamation",
      info: "fa-solid fa-circle-info",
      warning: "fa-solid fa-triangle-exclamation"
    };

    function show(message, type = "info", duration = 4200) {
      if (!container) return;
      const el = document.createElement("div");
      el.className = `toast toast-${type}`;
      el.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
      container.appendChild(el);

      setTimeout(() => {
        el.classList.add("is-leaving");
        el.addEventListener("animationend", () => el.remove(), { once: true });
      }, duration);
    }

    return { show };
  })();

  /* ---------------------------------------------------------
     PAIRING FLOW
  --------------------------------------------------------- */
  (function pairing() {
    const form = document.getElementById("pairForm");
    const countrySelect = document.getElementById("countryCode");
    const phoneInput = document.getElementById("phoneInput");
    const submitBtn = document.getElementById("pairSubmitBtn");
    const resultEl = document.getElementById("pairResult");
    const pairCodeEl = document.getElementById("pairCode");
    const copyBtn = document.getElementById("copyCodeBtn");
    const newSessionBtn = document.getElementById("newSessionBtn");
    const statusPill = document.getElementById("statusPill");
    const statusText = document.getElementById("statusText");

    if (!form) return;

    let pollTimer = null;
    let currentSessionId = null;

    function setStatus(state, label) {
      statusPill.dataset.state = state;
      statusText.textContent = label;
    }

    function setLoading(isLoading) {
      submitBtn.classList.toggle("is-loading", isLoading);
      submitBtn.disabled = isLoading;
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }

    function resetForm() {
      stopPolling();
      currentSessionId = null;
      form.hidden = false;
      resultEl.hidden = true;
      form.reset();
      setStatus("idle", "Waiting");
      pairCodeEl.textContent = "– – – – – –";
    }

    async function requestPairCode(phoneNumber) {
      const res = await fetch(`${API_BASE_URL}/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data || data.success === false) {
        throw new Error((data && data.error) || `Request failed (${res.status})`);
      }
      return data;
    }

    async function checkStatus(sessionId) {
      const res = await fetch(`${API_BASE_URL}/status/${encodeURIComponent(sessionId)}`);
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok || !data) throw new Error("Unable to read session status.");
      return data;
    }

    function mapStatus(rawStatus) {
      switch (rawStatus) {
        case "connected":
          return { state: "connected", label: "Connected" };
        case "connecting":
          return { state: "connecting", label: "Connecting" };
        case "logged_out":
        case "failed":
        case "disconnected":
          return { state: "disconnected", label: "Disconnected" };
        default:
          return { state: "idle", label: "Waiting" };
      }
    }

    function startPolling(sessionId) {
      stopPolling();
      pollTimer = setInterval(async () => {
        try {
          const data = await checkStatus(sessionId);
          const mapped = mapStatus(data.status);
          setStatus(mapped.state, mapped.label);

          if (mapped.state === "connected") {
            stopPolling();
            Toast.show("WhatsApp session connected successfully.", "success");
          }
          if (mapped.state === "disconnected") {
            stopPolling();
            Toast.show("Session disconnected. Generate a new code to reconnect.", "warning");
          }
        } catch (err) {
          // Keep polling silently on transient network errors.
        }
      }, STATUS_POLL_INTERVAL_MS);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const digits = (phoneInput.value || "").replace(/\D/g, "");
      if (digits.length < 6) {
        Toast.show("Enter a valid phone number.", "error");
        return;
      }
      const fullNumber = countrySelect.value + digits.replace(/^0+/, "");

      setLoading(true);
      setStatus("connecting", "Connecting");

      try {
        const data = await requestPairCode(fullNumber);
        currentSessionId = data.sessionId;
        pairCodeEl.textContent = data.pairCode;

        form.hidden = true;
        resultEl.hidden = false;

        Toast.show("Pairing code generated. Link your device now.", "success");
        startPolling(currentSessionId);
      } catch (err) {
        setStatus("idle", "Waiting");
        Toast.show(err.message || "Could not generate a pairing code.", "error");
      } finally {
        setLoading(false);
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const code = pairCodeEl.textContent.trim();
        if (!code || code.includes("–")) return;
        try {
          await navigator.clipboard.writeText(code);
          Toast.show("Pairing code copied to clipboard.", "success");
        } catch {
          Toast.show("Could not copy automatically — please copy it manually.", "warning");
        }
      });
    }

    if (newSessionBtn) {
      newSessionBtn.addEventListener("click", resetForm);
    }
  })();

  /* ---------------------------------------------------------
     LIVE STATISTICS
  --------------------------------------------------------- */
  (function stats() {
    const statsSection = document.getElementById("stats");
    const sessionsEl = document.getElementById("statSessions");
    const connectionsEl = document.getElementById("statConnections");
    const uptimeEl = document.getElementById("statUptime");
    const apiEl = document.getElementById("statApi");
    const liveBadge = document.getElementById("statsLive");
    const liveText = document.getElementById("statsLiveText");

    if (!statsSection) return;

    function animateValue(el, target, suffix = "") {
      if (REDUCED_MOTION) {
        el.textContent = target + suffix;
        return;
      }
      const start = 0;
      const duration = 1200;
      const startTime = performance.now();

      function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(start + (target - start) * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    async function loadStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/sessions`);
        if (!res.ok) throw new Error("offline");
        const data = await res.json();
        const sessions = (data && data.sessions) || [];

        const total = sessions.length;
        const connected = sessions.filter((s) => s.status === "connected").length;
        const uptimePercent = total > 0 ? Math.round((connected / total) * 100) : 0;

        animateValue(sessionsEl, total);
        animateValue(connectionsEl, connected);
        animateValue(uptimeEl, uptimePercent, "%");
        apiEl.textContent = "Online";

        liveBadge.classList.add("is-online");
        liveBadge.classList.remove("is-offline");
        liveText.textContent = "Live data from the DRUZZ MD API";
      } catch {
        sessionsEl.textContent = "--";
        connectionsEl.textContent = "--";
        uptimeEl.innerHTML = '--<span class="stat-unit">%</span>';
        apiEl.textContent = "Offline";

        liveBadge.classList.add("is-offline");
        liveBadge.classList.remove("is-online");
        liveText.textContent = "API unreachable — showing no data";
      }
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadStats();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(statsSection);
    } else {
      loadStats();
    }
  })();
})();
