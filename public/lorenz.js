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
	dt: 0.0065,
	trailLength: 1800,
	substeps: 6,
	rotationSpeed: 0.00022,
	background: '#0b1220',
	lineWidth: 1.6
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
	  width: Math.max(1, Math.floor(rect.width)),
	  height: Math.max(1, Math.floor(rect.height)),
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
	const scale = Math.min(viewport.width, viewport.height) * 0.018;
	const rotated = rotate(
	  { x: point3d.x, y: point3d.y - 2, z: point3d.z - 24 },
	  Math.PI * 0.22 + time * config.rotationSpeed,
	  -0.35
	);

	const depth = 110 / (110 + rotated.z);
	return {
	  x: viewport.width * 0.5 + rotated.x * scale * depth,
	  y: viewport.height * 0.54 - rotated.y * scale * depth,
	  alpha: Math.max(0.08, Math.min(1, depth)),
	  depth
	};
  }

  function drawBackground() {
	const gradient = context.createLinearGradient(0, 0, 0, viewport.height);
	gradient.addColorStop(0, '#0f172a');
	gradient.addColorStop(1, config.background);
	context.fillStyle = gradient;
	context.fillRect(0, 0, viewport.width, viewport.height);

	const glow = context.createRadialGradient(
	  viewport.width * 0.35,
	  viewport.height * 0.18,
	  10,
	  viewport.width * 0.35,
	  viewport.height * 0.18,
	  viewport.width * 0.75
	);
	glow.addColorStop(0, 'rgba(59, 130, 246, 0.12)');
	glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
	context.fillStyle = glow;
	context.fillRect(0, 0, viewport.width, viewport.height);
  }

  function drawTrail(time) {
	if (trail.length < 2) return;

	context.lineWidth = config.lineWidth;
	context.lineCap = 'round';
	context.lineJoin = 'round';

	for (let i = 1; i < trail.length; i += 1) {
	  const previous = projectPoint(trail[i - 1], time);
	  const current = projectPoint(trail[i], time);
	  const mix = i / trail.length;
	  const hue = 210 + mix * 110;
	  const alpha = Math.min(previous.alpha, current.alpha) * (0.14 + mix * 0.86);

	  context.strokeStyle = `hsla(${hue}, 90%, ${64 - mix * 16}%, ${alpha})`;
	  context.beginPath();
	  context.moveTo(previous.x, previous.y);
	  context.lineTo(current.x, current.y);
	  context.stroke();
	}

	const head = projectPoint(trail[trail.length - 1], time);
	context.beginPath();
	context.fillStyle = 'rgba(255, 255, 255, 0.95)';
	context.arc(head.x, head.y, 2.8, 0, Math.PI * 2);
	context.fill();
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
  for (let i = 0; i < 320; i += 1) integrateLorenz();
  start();

  window.addEventListener('resize', handleResize, { passive: true });
  if (typeof prefersReducedMotion.addEventListener === 'function') {
	prefersReducedMotion.addEventListener('change', start);
  } else if (typeof prefersReducedMotion.addListener === 'function') {
	prefersReducedMotion.addListener(start);
  }
})();

