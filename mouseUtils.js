/**
 * Mouse movement utilities for human-like interactions
 */

/**
 * Easing function for smooth animations
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Random number in range
 */
export function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer in range
 */
export function randomInt(min, max) {
  return Math.floor(random(min, max));
}

/**
 * Sleep/pause for given milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Move mouse smoothly from current position to target with bezier curve
 */
export async function moveMouse(page, fromX, fromY, toX, toY, steps = 50) {
  // Add random curve to make movement more natural
  const curveIntensity = random(50, 150);
  const curveX = (Math.random() - 0.5) * curveIntensity;
  const curveY = (Math.random() - 0.5) * curveIntensity;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const eased = easeInOutCubic(progress);

    // Quadratic bezier curve
    const t = eased;
    const t1 = 1 - t;

    const x = t1 * t1 * fromX + 2 * t1 * t * (fromX + curveX) + t * t * toX;
    const y = t1 * t1 * fromY + 2 * t1 * t * (fromY + curveY) + t * t * toY;

    await page.mouse.move(x, y);

    // Small random delay between steps for naturalness
    await sleep(random(1, 5));
  }
}

/**
 * Move mouse in a circular pattern
 */
export async function moveInCircle(page, centerX, centerY, radius, segments = 40) {
  const startAngle = random(0, Math.PI * 2);

  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (i / segments) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    await page.mouse.move(x, y);
    await sleep(random(10, 30));
  }
}

/**
 * Trace the outline of an element's bounding box
 */
export async function traceElementOutline(page, element, speed = 2) {
  const box = await element.boundingBox();
  if (!box) return;

  const { x, y, width, height } = box;
  const steps = Math.max(width, height) / speed;

  // Top edge
  for (let i = 0; i <= width; i += speed) {
    await page.mouse.move(x + i, y);
    await sleep(10);
  }

  // Right edge
  for (let i = 0; i <= height; i += speed) {
    await page.mouse.move(x + width, y + i);
    await sleep(10);
  }

  // Bottom edge
  for (let i = width; i >= 0; i -= speed) {
    await page.mouse.move(x + i, y + height);
    await sleep(10);
  }

  // Left edge
  for (let i = height; i >= 0; i -= speed) {
    await page.mouse.move(x, y + i);
    await sleep(10);
  }
}

/**
 * Hover over an element with optional wobble effect
 */
export async function hoverElement(page, element, duration = 2000, wobble = true) {
  const box = await element.boundingBox();
  if (!box) return;

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Get current mouse position
  const currentPos = await page.evaluate(() => {
    return { x: window.mouseX || window.innerWidth / 2, y: window.mouseY || window.innerHeight / 2 };
  });

  // Move to element
  await moveMouse(page, currentPos.x, currentPos.y, centerX, centerY);

  // Wobble/micro-movements while hovering
  if (wobble) {
    const wobbleSteps = duration / 200;
    for (let i = 0; i < wobbleSteps; i++) {
      const wobbleX = centerX + random(-10, 10);
      const wobbleY = centerY + random(-10, 10);
      await page.mouse.move(wobbleX, wobbleY);
      await sleep(200);
    }
  } else {
    await sleep(duration);
  }
}

/**
 * Perform a random scroll
 */
export async function randomScroll(page, direction = 'down') {
  const scrollAmount = randomInt(100, 500);
  const delta = direction === 'down' ? scrollAmount : -scrollAmount;

  await page.mouse.wheel(0, delta);
  await sleep(random(500, 1000));
}

/**
 * Get random position within viewport
 */
export async function getRandomViewportPosition(page) {
  const viewport = page.viewportSize();
  return {
    x: random(viewport.width * 0.1, viewport.width * 0.9),
    y: random(viewport.height * 0.1, viewport.height * 0.9),
  };
}

/**
 * Idle movement - tiny micro-movements near current position
 * Simulates a user reading/thinking while mouse is barely moving
 */
export async function idleMovement(page, centerX, centerY, duration = 3000) {
  const startTime = Date.now();
  const movements = Math.floor(duration / 300); // Move every ~300ms

  for (let i = 0; i < movements; i++) {
    if (Date.now() - startTime >= duration) break;

    // Very small random movements (2-8 pixels)
    const offsetX = random(-8, 8);
    const offsetY = random(-8, 8);

    await page.mouse.move(
      centerX + offsetX,
      centerY + offsetY,
      { steps: 3 }
    );

    await sleep(random(250, 400));
  }
}

/**
 * Swift movement to target - faster, more direct
 */
export async function swiftMoveTo(page, fromX, fromY, toX, toY) {
  const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  const steps = Math.max(20, Math.min(40, Math.floor(distance / 15)));

  // Less curve for swift movement
  const curveIntensity = random(20, 40);
  const curveX = (Math.random() - 0.5) * curveIntensity;
  const curveY = (Math.random() - 0.5) * curveIntensity;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const eased = easeInOutCubic(progress);

    const t = eased;
    const t1 = 1 - t;

    const x = t1 * t1 * fromX + 2 * t1 * t * (fromX + curveX) + t * t * toX;
    const y = t1 * t1 * fromY + 2 * t1 * t * (fromY + curveY) + t * t * toY;

    await page.mouse.move(x, y);
    await sleep(random(1, 3)); // Faster movement
  }
}

/**
 * Circle around an element (near it, not on it)
 */
export async function circleAroundElement(page, centerX, centerY, radius = 40) {
  const segments = 30;
  const startAngle = random(0, Math.PI * 2);

  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (i / segments) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    await page.mouse.move(x, y);
    await sleep(random(15, 30));
  }
}

/**
 * Track mouse position in page context
 */
export async function initializeMouseTracking(page) {
  await page.evaluate(() => {
    window.mouseX = window.innerWidth / 2;
    window.mouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
      window.mouseX = e.clientX;
      window.mouseY = e.clientY;
    });
  });
}
