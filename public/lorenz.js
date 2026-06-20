(() => {
  const canvas = document.getElementById('attractor');
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const config = {
	sigma: 10,
	rho: 28,
	beta: 8 / 3,
	dt: 0.0062,
	trailLength: 2200,
	substeps: 7,
	rotationSpeed: 0.00018,
	background: '#020617',
	lineWidth: 1.85
  };

  let point = { x: 0.1, y: 0, z: 0 };
  let trail = [];
  let animationFrame = 0;
  let lastTimestamp = 0;
  let viewport = { width: 1, height: 1, pixelRatio: 1 };

  function resetSystem() {
    point = { x: 0.1, y: 0, z: 0 };
    trail = [];
  }

  function integrateLorenz() {
    const { sigma, rho, beta, dt } = config;
    const dx = sigma * (point.y - point.x);
    const dy = point.x * (rho - point.z) - point.y;
    const dz = point.x * point.y - beta * point.z;

    point = {
      x: point.x + dx * dt,
      y: point.y + dy * dt,
      z: point.z + dz * dt
    };

    trail.push({ ...point });
    if (trail.length > config.trailLength) {
      trail.shift();
    }
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    viewport = {
      width: Math.max(1, Math.floor(rect.width || window.innerWidth)),
      height: Math.max(1, Math.floor(rect.height || window.innerHeight)),
      pixelRatio
    };

    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function rotate(point3d, angleY, angleX) {
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);

    const x1 = point3d.x * cosY - point3d.z * sinY;
    const z1 = point3d.x * sinY + point3d.z * cosY;
    const y1 = point3d.y;

    return {
      x: x1,
      y: y1 * cosX - z1 * sinX,
      z: y1 * sinX + z1 * cosX
    };
  }

  function projectPoint(point3d, time) {
    const scale = Math.min(viewport.width, viewport.height) * 0.023;
    const rotated = rotate(
      { x: point3d.x, y: point3d.y - 2, z: point3d.z - 24 },
      Math.PI * 0.18 + time * config.rotationSpeed,
      -0.38
    );

    const depth = 110 / (110 + rotated.z);
    return {
      x: viewport.width * 0.5 + rotated.x * scale * depth,
      y: viewport.height * 0.53 - rotated.y * scale * depth,
      alpha: Math.max(0.08, Math.min(1, depth)),
      depth
    };
  }

  function drawBackground() {
    const gradient = context.createLinearGradient(0, 0, 0, viewport.height);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.45, '#081225');
    gradient.addColorStop(1, config.background);
    context.fillStyle = gradient;
    context.fillRect(0, 0, viewport.width, viewport.height);

    const cyanGlow = context.createRadialGradient(
      viewport.width * 0.28,
      viewport.height * 0.26,
      0,
      viewport.width * 0.28,
      viewport.height * 0.26,
      viewport.width * 0.48
    );
    cyanGlow.addColorStop(0, 'rgba(34, 211, 238, 0.12)');
    cyanGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
    context.fillStyle = cyanGlow;
    context.fillRect(0, 0, viewport.width, viewport.height);

    const magentaGlow = context.createRadialGradient(
      viewport.width * 0.76,
      viewport.height * 0.28,
      0,
      viewport.width * 0.76,
      viewport.height * 0.28,
      viewport.width * 0.42
    );
    magentaGlow.addColorStop(0, 'rgba(232, 121, 249, 0.11)');
    magentaGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
    context.fillStyle = magentaGlow;
    context.fillRect(0, 0, viewport.width, viewport.height);

    const vignette = context.createRadialGradient(
      viewport.width * 0.5,
      viewport.height * 0.5,
      Math.min(viewport.width, viewport.height) * 0.12,
      viewport.width * 0.5,
      viewport.height * 0.5,
      Math.max(viewport.width, viewport.height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
    vignette.addColorStop(1, 'rgba(2, 6, 23, 0.7)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, viewport.width, viewport.height);
  }

  function drawTrail(time) {
	if (trail.length < 2) return;

	context.lineWidth = Math.max(1.05, Math.min(2.4, Math.min(viewport.width, viewport.height) * 0.0019));
	context.lineCap = 'round';
	context.lineJoin = 'round';
	context.shadowBlur = 12;

	for (let i = 1; i < trail.length; i += 1) {
	  const previous = projectPoint(trail[i - 1], time);
	  const current = projectPoint(trail[i], time);
	  const mix = i / trail.length;
	  const hue = 188 + mix * 135;
	  const lightness = 72 - mix * 24;
	  const alpha = Math.min(previous.alpha, current.alpha) * (0.08 + mix * 0.92);

	  context.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.55})`;
	  context.strokeStyle = `hsla(${hue}, 96%, ${lightness}%, ${alpha})`;
	  context.beginPath();
	  context.moveTo(previous.x, previous.y);
	  context.lineTo(current.x, current.y);
	  context.stroke();
	}

	context.shadowBlur = 22;
	const head = projectPoint(trail[trail.length - 1], time);
	context.beginPath();
	context.fillStyle = 'rgba(255, 255, 255, 0.98)';
	context.shadowColor = 'rgba(255, 255, 255, 0.8)';
	context.arc(head.x, head.y, 2.8, 0, Math.PI * 2);
	context.fill();
	context.shadowBlur = 0;
  }

  function render(timestamp) {
	 drawBackground();

	 const delta = Math.min(32, timestamp - lastTimestamp || 16.67);
	 const normalized = delta / 16.67;
	 const steps = Math.max(1, Math.round(config.substeps * normalized));

	 for (let i = 0; i < steps; i += 1) {
	   integrateLorenz();
	 }

	 drawTrail(timestamp);
	 lastTimestamp = timestamp;

	 if (!prefersReducedMotion.matches) {
	   animationFrame = window.requestAnimationFrame(render);
	 }
  }

  function renderStillFrame() {
	 drawBackground();
	 if (trail.length === 0) {
	   for (let i = 0; i < config.trailLength; i += 1) {
	     integrateLorenz();
	   }
	 }
	 drawTrail(0);
  }

  function start() {
	 window.cancelAnimationFrame(animationFrame);
	 lastTimestamp = 0;

	 if (prefersReducedMotion.matches) {
	   renderStillFrame();
	   return;
	 }

	 animationFrame = window.requestAnimationFrame(render);
  }

  function handleResize() {
	 resizeCanvas();
	 if (prefersReducedMotion.matches) {
	   renderStillFrame();
	 }
  }

  resizeCanvas();
  resetSystem();
  for (let i = 0; i < 420; i += 1) integrateLorenz();
  start();

  window.addEventListener('resize', handleResize, { passive: true });
  if (typeof prefersReducedMotion.addEventListener === 'function') {
	prefersReducedMotion.addEventListener('change', start);
  } else if (typeof prefersReducedMotion.addListener === 'function') {
	prefersReducedMotion.addListener(start);
  }
})();

