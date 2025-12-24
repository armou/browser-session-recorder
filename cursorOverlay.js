/**
 * Custom cursor overlay system
 * Injects a visual cursor that follows mouse movements
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the custom cursor SVG content
 */
export function getCursorSvg() {
  try {
    const cursorPath = join(__dirname, 'cursor.svg');
    return readFileSync(cursorPath, 'utf-8');
  } catch (error) {
    console.warn('⚠️  Custom cursor.svg not found, using default');
    return null;
  }
}

/**
 * Inject custom cursor overlay into the page
 */
export async function injectCursorOverlay(page) {
  const cursorSvg = getCursorSvg();

  await page.evaluate((svg) => {
    // Remove existing cursor if present
    const existing = document.getElementById('custom-cursor-overlay');
    if (existing) existing.remove();

    // Create cursor container
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor-overlay';
    cursor.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      transition: opacity 0.2s;
      width: 30px;
      height: 30px;
      transform: translate(-5px, -5px);
    `;

    // Add SVG or fallback
    if (svg) {
      cursor.innerHTML = svg;
      const svgElement = cursor.querySelector('svg');
      if (svgElement) {
        svgElement.style.cssText = `
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        `;
      }
    } else {
      // Fallback: red arrow
      cursor.innerHTML = `
        <svg width="30" height="30" viewBox="0 0 30 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M 9 3 L 8 4 L 8 21 L 9 22 L 9.796875 21.601562 L 12.919922 18.119141 L 16.382812 26.117188 C 16.701812 26.855187 17.566828 27.188469 18.298828 26.855469 C 19.020828 26.527469 19.340672 25.678078 19.013672 24.955078 L 15.439453 17.039062 L 21 17 L 22 16 L 21.628906 15.222656 L 9.7832031 3.3789062 L 9 3 z" fill="#ff0000" />
        </svg>
      `;
    }

    document.body.appendChild(cursor);

    // Track mouse position globally
    window.customCursor = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      element: cursor
    };

    // Update cursor position
    function updateCursor(x, y) {
      window.customCursor.x = x;
      window.customCursor.y = y;
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      cursor.style.opacity = '1';
    }

    // Listen to mouse movements
    document.addEventListener('mousemove', (e) => {
      updateCursor(e.clientX, e.clientY);
    });

    // Initialize position
    updateCursor(window.innerWidth / 2, window.innerHeight / 2);

    // Add click effect
    document.addEventListener('click', () => {
      cursor.style.transform = 'translate(-5px, -5px) scale(0.9)';
      setTimeout(() => {
        cursor.style.transform = 'translate(-5px, -5px) scale(1)';
      }, 150);
    });

    console.log('✅ Custom cursor overlay injected');
  }, cursorSvg);
}

/**
 * Update cursor position programmatically
 */
export async function updateCursorPosition(page, x, y) {
  await page.evaluate(({ x, y }) => {
    if (window.customCursor && window.customCursor.element) {
      window.customCursor.element.style.left = x + 'px';
      window.customCursor.element.style.top = y + 'px';
      window.customCursor.x = x;
      window.customCursor.y = y;
    }
  }, { x, y });
}

/**
 * Add click animation to cursor
 */
export async function animateClick(page) {
  await page.evaluate(() => {
    const cursor = window.customCursor?.element;
    if (cursor) {
      cursor.style.transition = 'transform 0.15s';
      cursor.style.transform = 'translate(-5px, -5px) scale(0.85)';
      setTimeout(() => {
        cursor.style.transform = 'translate(-5px, -5px) scale(1)';
      }, 150);
    }
  });
}

/**
 * Highlight element being hovered
 */
export async function highlightElement(page, selector, duration = 1000) {
  await page.evaluate(({ selector, duration }) => {
    const element = document.querySelector(selector);
    if (!element) return;

    // Add highlight effect
    const originalOutline = element.style.outline;
    const originalTransition = element.style.transition;

    element.style.transition = 'outline 0.3s';
    element.style.outline = '2px solid rgba(37, 99, 235, 0.6)';
    element.style.outlineOffset = '4px';

    // Remove after duration
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.transition = originalTransition;
    }, duration);
  }, { selector, duration });
}
