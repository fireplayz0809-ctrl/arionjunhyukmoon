const revealItems = document.querySelectorAll(".reveal");
const progressBar = document.getElementById("scroll-progress");
const navLinks = document.querySelectorAll('.top-nav a[href^="#"]');
const sections = [...document.querySelectorAll("main section[id]")];
const sectionPanels = document.querySelectorAll(".section");
const interactiveCards = document.querySelectorAll(".interactive-3d");
const counters = document.querySelectorAll(".metric-value");

const storyItems = [...document.querySelectorAll(".story-item")];
const storyLabel = document.getElementById("story-label");
const storyTitle = document.getElementById("story-title");
const storyText = document.getElementById("story-text");
const storyImage = document.getElementById("story-image");

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href === "#") return;

  const target = document.querySelector(href);
  if (!target) return;

  event.preventDefault();
  const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight + 12;
  window.scrollTo({ top, behavior: "smooth" });
  history.pushState(null, "", href);
});

const carGate = document.querySelector("[data-car-gate]");
if (carGate) {
  const carAuth = carGate.querySelector("[data-car-auth]");
  const carModelStage = document.querySelector("[data-car-stage]");

  const unlockHercules = () => {
    carGate.classList.add("is-unlocked");
    carModelStage?.classList.add("is-visible");
  };

  if (carAuth) {
    carAuth.addEventListener("submit", (event) => {
      event.preventDefault();
      unlockHercules();
    });
  }
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 55, 320)}ms`;
  revealObserver.observe(item);
});

function updateProgress() {
  if (!progressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

function updateActiveSection() {
  if (!sections.length || !navLinks.length) return;
  const triggerY = window.scrollY + window.innerHeight * 0.35;
  let activeId = sections[0].id;

  sections.forEach((section) => {
    if (triggerY >= section.offsetTop) activeId = section.id;
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });
}

function updateSectionGlow() {
  sectionPanels.forEach((panel) => {
    const rect = panel.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const mid = window.innerHeight / 2;
    const dist = Math.min(Math.abs(center - mid), window.innerHeight);
    const glow = Math.max(0, 1 - dist / window.innerHeight);
    panel.style.setProperty("--glow", glow.toFixed(3));
  });
}

function updateStoryPanel() {
  if (!storyItems.length || !storyLabel || !storyTitle || !storyText || !storyImage) return;

  let best = storyItems[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  storyItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = item;
    }
  });

  storyLabel.textContent = best.dataset.label || "Phase";
  storyTitle.textContent = best.dataset.title || "Story";
  storyText.textContent = best.dataset.text || "";
  storyImage.textContent = best.dataset.image || "Placeholder";
}

function handleCardTilt(event, card) {
  const rect = card.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const rotateY = ((x / rect.width) - 0.5) * 10;
  const rotateX = (0.5 - (y / rect.height)) * 10;
  card.style.transform = `perspective(950px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
}

interactiveCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => handleCardTilt(event, card));
  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(950px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  });
});

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.target || 0);
      const start = performance.now();
      const duration = 1100;

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = String(Math.round(target * progress));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.4 }
);

counters.forEach((counter) => countObserver.observe(counter));

const form = document.querySelector(".contact-form");
if (form) {
  form.addEventListener("submit", (event) => {
    const action = (form.getAttribute("action") || "").toLowerCase();
    if (action.startsWith("mailto:")) {
      return;
    }

    event.preventDefault();
    alert("Thank you. Your sponsorship enquiry has been captured.");
    form.reset();
  });
}

function initParticles() {
  const canvas = document.getElementById("particle-field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.style.display = "none";
    return;
  }

  const pointer = { x: -9999, y: -9999, active: false };
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  let shapes = [];

  function rand(min, max, seed) {
    const value = Math.sin(seed * 999.7) * 43758.5453;
    return min + (max - min) * (value - Math.floor(value));
  }

  function buildShape(index, width, height) {
    const seed = index + 1;
    const sides = 3 + Math.floor(rand(0, 4, seed * 1.11));
    return {
      seed,
      sides,
      x: rand(-0.18, 1.18, seed * 1.23) * width,
      y: rand(-0.18, 1.18, seed * 1.41) * height,
      vx: rand(-0.08, 0.08, seed * 1.73),
      vy: rand(-0.06, 0.06, seed * 1.91),
      rx: rand(18, 98, seed * 2.11),
      ry: rand(14, 84, seed * 2.37),
      rotation: rand(0, Math.PI * 2, seed * 2.67),
      rotSpeed: rand(-0.00045, 0.00045, seed * 3.11),
      drift: rand(0.65, 1.3, seed * 3.53),
      wobble: rand(0.22, 0.72, seed * 4.01),
      phase: rand(0, Math.PI * 2, seed * 4.41),
      alpha: rand(0.08, 0.22, seed * 4.91),
      spread: rand(0.7, 1.35, seed * 5.33)
    };
  }

  function resize() {
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(28, Math.min(56, Math.floor(window.innerWidth / 20)));
    shapes = Array.from({ length: count }, (_, index) => buildShape(index, window.innerWidth, window.innerHeight));
  }

  function projectShape(shape, time) {
    const t = time * 0.00042;
    const flowX = Math.sin(t + shape.phase) * 30 + Math.cos(t * 1.1 + shape.phase * 0.7) * 10;
    const flowY = Math.cos(t * 1.05 + shape.phase * 1.12) * 26 + Math.sin(t * 0.82 + shape.phase * 0.4) * 12;

    let x = shape.x + flowX * shape.drift;
    let y = shape.y + flowY * shape.drift;

    shape.rotation += shape.rotSpeed;
    shape.rx += Math.sin(t * 0.9 + shape.phase) * 0.02;
    shape.ry += Math.cos(t * 0.78 + shape.phase * 1.2) * 0.02;

    const dx = pointer.x - x;
    const dy = pointer.y - y;
    const dist = Math.hypot(dx, dy);
    if (pointer.active && dist < 260) {
      const strength = (260 - dist) / 260;
      x -= dx * 0.05 * strength;
      y -= dy * 0.05 * strength;
    }

    shape.x += shape.vx * shape.spread;
    shape.y += shape.vy * shape.spread;

    const margin = 160;
    if (shape.x < -margin) shape.x = window.innerWidth + margin;
    if (shape.x > window.innerWidth + margin) shape.x = -margin;
    if (shape.y < -margin) shape.y = window.innerHeight + margin;
    if (shape.y > window.innerHeight + margin) shape.y = -margin;

    const points = [];
    const wobbleStrength = 1 + Math.sin(t * 1.8 + shape.phase) * shape.wobble;
    for (let i = 0; i < shape.sides; i += 1) {
      const angle = shape.rotation + (Math.PI * 2 * i) / shape.sides;
      const localWobble = 0.84 + Math.sin(t * 1.4 + shape.phase + i * 1.23) * 0.18;
      const px = x + Math.cos(angle) * shape.rx * localWobble * wobbleStrength;
      const py = y + Math.sin(angle) * shape.ry * (0.88 + Math.cos(t * 1.05 + shape.phase + i * 0.71) * 0.14);
      points.push({ x: px, y: py });
    }

    return { shape, points, dist, x, y };
  }

  function drawShape(projected, time) {
    const { shape, points, dist, x, y } = projected;
    if (!points.length) return;

    const hover = pointer.active && dist < 240;
    const edgeColor = hover ? 'rgba(240, 182, 83, 0.48)' : 'rgba(240, 182, 83, 0.20)';
    const nodeColor = hover ? 'rgba(240, 182, 83, 0.56)' : 'rgba(240, 182, 83, 0.30)';

    ctx.save();
    ctx.lineWidth = hover ? 1.4 : 1;
    ctx.strokeStyle = edgeColor;

    // Outer contour.
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();

    // A couple of diagonal strokes give the polygonal wireframe feel.
    if (points.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.moveTo(points[1].x, points[1].y);
      ctx.lineTo(points[3].x, points[3].y);
      if (points.length >= 5) {
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      }
      ctx.strokeStyle = hover ? 'rgba(240, 182, 83, 0.26)' : 'rgba(240, 182, 83, 0.14)';
      ctx.stroke();
    }

    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.fillStyle = nodeColor;
      ctx.arc(point.x, point.y, hover ? 2.9 : 2.25, 0, Math.PI * 2);
      ctx.fill();

      if (index > 0) {
        const prev = points[index - 1];
        const distLine = Math.hypot(point.x - prev.x, point.y - prev.y);
        ctx.beginPath();
        ctx.strokeStyle = hover ? 'rgba(240, 182, 83, 0.30)' : 'rgba(240, 182, 83, 0.16)';
        ctx.lineWidth = distLine > 220 ? 0.8 : 1;
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    });

    if (pointer.active) {
      const nearest = points
        .map((point) => ({
          point,
          distToPointer: Math.hypot(pointer.x - point.x, pointer.y - point.y)
        }))
        .filter(({ distToPointer }) => distToPointer < 280)
        .sort((a, b) => a.distToPointer - b.distToPointer)
        .slice(0, 3);

      nearest.forEach(({ point, distToPointer }) => {
        const alpha = (1 - distToPointer / 280) * 0.36;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(240, 182, 83, ' + alpha + ')';
        ctx.lineWidth = 1.05;
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      });

      const pointerDist = Math.hypot(pointer.x - x, pointer.y - y);
      if (pointerDist < 260) {
        const alpha = (1 - pointerDist / 260) * 0.15;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(240, 182, 83, ' + alpha + ')';
        ctx.lineWidth = 1;
        ctx.arc(pointer.x, pointer.y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const projected = shapes.map((shape) => projectShape(shape, time));
    projected.forEach((item) => drawShape(item, time));

    requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });

  window.addEventListener("pointerleave", () => {
    pointer.x = -9999;
    pointer.y = -9999;
    pointer.active = false;
  });

  window.addEventListener("resize", resize);
  resize();
  draw(performance.now());
}


let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateProgress();
    updateActiveSection();
    updateSectionGlow();
    updateStoryPanel();
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });

updateProgress();
updateActiveSection();
updateSectionGlow();
updateStoryPanel();
initParticles();
