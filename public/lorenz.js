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
    trailLength: 1700,
    substeps: 6,
    rotationSpeed: 0.00017,
    lineWidth: 1.5,
    depthBase: 110,
    bucketCount: 7
  };

  let pointX = 0.1;
  let pointY = 0;
  let pointZ = 0;

  const trailX = new Float32Array(config.trailLength);
  const trailY = new Float32Array(config.trailLength);
  const trailZ = new Float32Array(config.trailLength);
  let trailHead = 0;
  let trailCount = 0;

  const projectedX = new Float32Array(config.trailLength);
  const projectedY = new Float32Array(config.trailLength);
  const projectedA = new Float32Array(config.trailLength);

  const backgroundCanvas = document.createElement('canvas');
  const backgroundContext = backgroundCanvas.getContext('2d', { alpha: false });

  let animationFrame = 0;
  let lastTimestamp = 0;
  let viewport = { width: 1, height: 1, pixelRatio: 1 };

  function resetSystem() {
    pointX = 0.1;
    pointY = 0;
    pointZ = 0;
    trailHead = 0;
    trailCount = 0;
  }

  function pushTrailPoint(x, y, z) {
    trailX[trailHead] = x;
    trailY[trailHead] = y;
    trailZ[trailHead] = z;
    trailHead = (trailHead + 1) % config.trailLength;
    if (trailCount < config.trailLength) {
      trailCount += 1;
    }
  }

  function integrateLorenz() {
    const dx = config.sigma * (pointY - pointX);
    const dy = pointX * (config.rho - pointZ) - pointY;
    const dz = pointX * pointY - config.beta * pointZ;

    pointX += dx * config.dt;
    pointY += dy * config.dt;
    pointZ += dz * config.dt;

    pushTrailPoint(pointX, pointY, pointZ);
  }

  function renderBackground() {
    if (!backgroundContext) return;

    const width = viewport.width;
    const height = viewport.height;

    const gradient = backgroundContext.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.45, '#081225');
    gradient.addColorStop(1, '#020617');
    backgroundContext.fillStyle = gradient;
    backgroundContext.fillRect(0, 0, width, height);

    const cyanGlow = backgroundContext.createRadialGradient(
      width * 0.28,
      height * 0.26,
      0,
      width * 0.28,
      height * 0.26,
      width * 0.48
    );
    cyanGlow.addColorStop(0, 'rgba(34, 211, 238, 0.12)');
    cyanGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
    backgroundContext.fillStyle = cyanGlow;
    backgroundContext.fillRect(0, 0, width, height);

    const magentaGlow = backgroundContext.createRadialGradient(
      width * 0.76,
      height * 0.28,
      0,
      width * 0.76,
      height * 0.28,
      width * 0.42
    );
    magentaGlow.addColorStop(0, 'rgba(232, 121, 249, 0.11)');
    magentaGlow.addColorStop(1, 'rgba(2, 6, 23, 0)');
    backgroundContext.fillStyle = magentaGlow;
    backgroundContext.fillRect(0, 0, width, height);

    const vignette = backgroundContext.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.12,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(2, 6, 23, 0)');
    vignette.addColorStop(1, 'rgba(2, 6, 23, 0.7)');
    backgroundContext.fillStyle = vignette;
    backgroundContext.fillRect(0, 0, width, height);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);

    viewport = {
      width: Math.max(1, Math.floor(rect.width || window.innerWidth)),
      height: Math.max(1, Math.floor(rect.height || window.innerHeight)),
      pixelRatio
    };

    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    backgroundCanvas.width = viewport.width;
    backgroundCanvas.height = viewport.height;
    renderBackground();
  }

  function drawBackground() {
    context.drawImage(backgroundCanvas, 0, 0);
  }

  function projectTrailPoints(time) {
    const angleY = Math.PI * 0.18 + time * config.rotationSpeed;
    const angleX = -0.38;
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);

    const scale = Math.min(viewport.width, viewport.height) * 0.023;
    const centerX = viewport.width * 0.5;
    const centerY = viewport.height * 0.53;

    const start = (trailHead - trailCount + config.trailLength) % config.trailLength;

    for (let i = 0; i < trailCount; i += 1) {
      const index = (start + i) % config.trailLength;
      const x = trailX[index];
      const y = trailY[index] - 2;
      const z = trailZ[index] - 24;

      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y1 = y;

      const ry = y1 * cosX - z1 * sinX;
      const rz = y1 * sinX + z1 * cosX;
      const depth = config.depthBase / (config.depthBase + rz);

      projectedX[i] = centerX + x1 * scale * depth;
      projectedY[i] = centerY - ry * scale * depth;
      projectedA[i] = depth < 0.08 ? 0.08 : depth > 1 ? 1 : depth;
    }
  }

  function drawTrail() {
    if (trailCount < 2) return;

    context.lineWidth = Math.max(
      1.0,
      Math.min(2.1, Math.min(viewport.width, viewport.height) * 0.0016)
    );
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.shadowBlur = 0;

    const segmentCount = trailCount - 1;
    const bucketCount = config.bucketCount;

    for (let bucket = 0; bucket < bucketCount; bucket += 1) {
      const startSegment = Math.floor((segmentCount * bucket) / bucketCount);
      const endSegment = Math.floor((segmentCount * (bucket + 1)) / bucketCount) - 1;
      if (endSegment < startSegment) continue;

      const mix = (bucket + 0.5) / bucketCount;
      const hue = 188 + mix * 135;
      const lightness = 72 - mix * 24;
      const alpha = 0.18 + mix * 0.62;

      context.strokeStyle = `hsla(${hue}, 95%, ${lightness}%, ${alpha})`;
      context.beginPath();
      context.moveTo(projectedX[startSegment], projectedY[startSegment]);

      for (let segment = startSegment; segment <= endSegment; segment += 1) {
        context.lineTo(projectedX[segment + 1], projectedY[segment + 1]);
      }

      context.stroke();
    }

    const headIndex = trailCount - 1;
    context.shadowBlur = 10;
    context.shadowColor = 'rgba(255, 255, 255, 0.6)';
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.beginPath();
    context.arc(projectedX[headIndex], projectedY[headIndex], 2.4, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
  }

  function render(timestamp) {
    drawBackground();

    const delta = Math.min(32, timestamp - lastTimestamp || 16.67);
    const normalized = delta / 16.67;
    const steps = Math.min(10, Math.max(1, Math.round(config.substeps * normalized)));

    for (let i = 0; i < steps; i += 1) {
      integrateLorenz();
    }

    projectTrailPoints(timestamp);
    drawTrail();

    lastTimestamp = timestamp;
    if (!prefersReducedMotion.matches) {
      animationFrame = window.requestAnimationFrame(render);
    }
  }

  function renderStillFrame() {
    if (trailCount < config.trailLength * 0.7) {
      const target = Math.floor(config.trailLength * 0.7) - trailCount;
      for (let i = 0; i < target; i += 1) {
        integrateLorenz();
      }
    }

    drawBackground();
    projectTrailPoints(0);
    drawTrail();
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
  for (let i = 0; i < 360; i += 1) {
    integrateLorenz();
  }
  start();

  window.addEventListener('resize', handleResize, { passive: true });
  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', start);
  } else if (typeof prefersReducedMotion.addListener === 'function') {
    prefersReducedMotion.addListener(start);
  }
})();

