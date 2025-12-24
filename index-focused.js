#!/usr/bin/env node

/**
 * Ultra-Realistic Browser Session Recorder with ShyMouse
 * Uses shy-mouse-playwright for ultra-human-like mouse movements
 * Focus on: chartLabels, recommendations, leaderTitle
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import ShyMouse from '@ab6162/shy-mouse-playwright';
import { config } from './config.js';
import {
  sleep,
  random,
  randomInt,
  idleMovement,
} from './mouseUtils.js';
import {
  injectCursorOverlay,
  updateCursorPosition,
  highlightElement,
} from './cursorOverlay.js';
import { ElementPrioritizer } from './iterativeRefinement.js';

class UltraRealisticSessionRecorder {
  constructor(configuration = config) {
    this.config = configuration;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.shyMouse = null; // ShyMouse instance
    this.mousePosition = { x: 0, y: 0 };
    this.prioritizer = new ElementPrioritizer();
  }

  async initializeBrowser() {
    console.log('🌐 Launching browser with video recording...');

    if (!existsSync('./recordings')) {
      mkdirSync('./recordings', { recursive: true });
    }

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 0,
    });

    this.context = await this.browser.newContext({
      viewport: this.config.browser.viewport,
      recordVideo: {
        dir: './recordings/',
        size: this.config.browser.viewport,
      },
    });

    this.page = await this.context.newPage();

    // Initialize ShyMouse for ultra-realistic movements
    console.log('🐭 Initializing ShyMouse (ultra-realistic movements)...');
    this.shyMouse = new ShyMouse(this.page);

    console.log(`🌐 Navigating to: ${this.config.url}`);
    await this.page.goto(this.config.url, { waitUntil: 'networkidle' });
    await sleep(3000);

    console.log('🎨 Injecting custom cursor overlay...');
    await injectCursorOverlay(this.page);

    console.log('✅ Page loaded');
    console.log('📹 Video recording started');
  }

  async getTargetElements() {
    const elements = {};

    for (const [key, selector] of Object.entries(this.config.selectors)) {
      try {
        const found = await this.page.$$(selector);
        if (found.length > 0) {
          elements[key] = found;
          console.log(`🎯 Found ${found.length} elements for "${key}"`);
        }
      } catch (error) {
        // Element not found
      }
    }

    return elements;
  }

  /**
   * Get element position
   */
  async getElementCenter(element) {
    const box = await element.boundingBox();
    if (!box) return null;

    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
  }

  /**
   * Move to element using ShyMouse's realistic Bezier curves
   */
  async moveToElement(element) {
    const box = await element.boundingBox();
    if (!box) return null;

    const center = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };

    // Get current position
    const currentX = this.shyMouse.lastPos.x || this.config.browser.viewport.width / 2;
    const currentY = this.shyMouse.lastPos.y || this.config.browser.viewport.height / 4;

    // Calculate Bezier path manually to target
    const { points, finalPos } = this.shyMouse.calculateBezierPoints(
      currentX,
      currentY,
      center.x,
      center.y,
      box,
      this.page.viewportSize(),
      {
        steps: randomInt(60, 90), // More steps for smoother movement
        curveIntensity: random(0.3, 0.8), // Natural curve
      }
    );

    // Move along the Bezier path with boundary validation
    const viewport = this.page.viewportSize();
    for (const point of points) {
      // Clamp coordinates to valid viewport bounds
      const safeX = Math.max(0, Math.min(viewport.width - 1, point.x || 0));
      const safeY = Math.max(0, Math.min(viewport.height - 1, point.y || 0));

      // Skip invalid points (NaN or Infinity)
      if (!isFinite(safeX) || !isFinite(safeY)) continue;

      await this.page.mouse.move(safeX, safeY);
      await updateCursorPosition(this.page, safeX, safeY);
      await sleep(random(3, 8));
    }

    // Update ShyMouse's last position
    this.shyMouse.lastPos = finalPos;
    this.mousePosition = finalPos;

    return finalPos;
  }

  /**
   * Perform ultra-realistic interaction with ShyMouse
   * Pattern: move → hover → circle/trace → idle → done
   */
  async ultraRealisticInteraction(element, elementType, elementIndex = 0) {
    const box = await element.boundingBox();
    if (!box) return false;

    console.log(`\n🎯 Focusing on ${elementType} #${elementIndex}`);

    // 1. ShyMouse move (ultra-realistic Bezier path)
    console.log(`  → ShyMouse moving with Bezier curves...`);

    try {
      const finalPos = await this.moveToElement(element);
      if (!finalPos) return false;

      const center = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      };

      // Highlight the element
      try {
        const selector = await this.page.evaluate((el) => {
          if (el.id) return `#${el.id}`;
          if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter(c => c);
            if (classes.length > 0) return `.${classes[0]}`;
          }
          return el.tagName.toLowerCase();
        }, element);
        await highlightElement(this.page, selector, 1500);
      } catch (e) {
        // Continue
      }

      // 2. Hover with realistic micro-movements
      const hoverDuration = random(1800, 2800);
      console.log(`  → Hovering for ${Math.round(hoverDuration)}ms with micro-movements`);

      const hoverSteps = Math.floor(hoverDuration / 400);
      const viewport = this.page.viewportSize();
      for (let i = 0; i < hoverSteps; i++) {
        // Micro wobbles with bounds checking
        const wobbleX = Math.max(0, Math.min(viewport.width - 1, center.x + random(-6, 6)));
        const wobbleY = Math.max(0, Math.min(viewport.height - 1, center.y + random(-6, 6)));

        await this.page.mouse.move(wobbleX, wobbleY, { steps: 3 });
        await updateCursorPosition(this.page, wobbleX, wobbleY);
        await sleep(400);
      }

      this.prioritizer.recordInteraction(elementType, element, hoverDuration, 'hover');

      // 3. Choose action: circle, trace, or just hover
      const action = Math.random();

      if (action < 0.4) {
        // Circle around element
        const radius = random(35, 60);
        console.log(`  → Circling around (radius: ${Math.round(radius)}px)`);

        const segments = 24;
        const startAngle = random(0, Math.PI * 2);

        for (let i = 0; i <= segments; i++) {
          const angle = startAngle + (i / segments) * Math.PI * 2;
          const x = center.x + Math.cos(angle) * radius;
          const y = center.y + Math.sin(angle) * radius;

          await this.page.mouse.move(x, y, { steps: 2 });
          await updateCursorPosition(this.page, x, y);
          await sleep(random(20, 40));
        }

        this.prioritizer.recordInteraction(elementType, element, 0, 'circle');
      } else if (action < 0.7) {
        // Trace outline
        console.log(`  → Tracing element outline`);

        const corners = [
          { x: box.x, y: box.y },
          { x: box.x + box.width, y: box.y },
          { x: box.x + box.width, y: box.y + box.height },
          { x: box.x, y: box.y + box.height },
          { x: box.x, y: box.y },
        ];

        for (const corner of corners) {
          await this.page.mouse.move(corner.x, corner.y, { steps: 10 });
          await updateCursorPosition(this.page, corner.x, corner.y);
          await sleep(random(100, 200));
        }

        this.prioritizer.recordInteraction(elementType, element, 0, 'trace');
      } else {
        // Just hover (30% of the time)
        console.log(`  → Simple hover, no additional action`);
      }

      // 4. Idle movement - barely moving, like reading
      const idleDuration = random(2200, 4200);
      console.log(`  → Idling with micro-movements for ${Math.round(idleDuration)}ms`);

      const idleX = center.x + random(-25, 25);
      const idleY = center.y + random(10, 35);

      await this.page.mouse.move(idleX, idleY, { steps: 8 });
      await updateCursorPosition(this.page, idleX, idleY);

      // Micro-movements during idle
      await idleMovement(this.page, idleX, idleY, idleDuration);

      this.mousePosition = { x: idleX, y: idleY };
      this.shyMouse.lastPos = { x: idleX, y: idleY };

      return true;
    } catch (error) {
      console.log(`  ⚠️  Interaction failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Swift move to next element using ShyMouse
   */
  async swiftMoveToNext(nextElement) {
    console.log(`  ⚡ Swift ShyMouse move to next element...`);

    await sleep(random(400, 800));

    try {
      await this.moveToElement(nextElement);
    } catch (e) {
      console.log(`  ⚠️  Swift move failed: ${e.message}`);
    }
  }

  /**
   * Main simulation with ultra-realistic ShyMouse movements
   */
  async simulateUltraRealisticBehavior(duration) {
    console.log(`🖱️  Starting ultra-realistic ShyMouse simulation for ${duration / 1000} seconds...`);

    const startTime = Date.now();
    const elements = await this.getTargetElements();

    // Categorize and filter
    const categorized = this.prioritizer.categorizeElements(
      elements,
      this.config.selectors
    );

    console.log(
      `📊 Focus elements: ${categorized.high.length} high-priority, ` +
        `${categorized.medium.length} medium-priority, ` +
        `${categorized.low.length} low-priority`
    );

    // Create prioritized sequence: 85% high-priority, 15% medium
    const sequence = [];

    // Add all high-priority elements
    categorized.high.forEach((item, idx) => {
      sequence.push({ ...item, index: idx });
    });

    // Add some medium-priority elements
    const mediumCount = Math.min(2, categorized.medium.length);
    for (let i = 0; i < mediumCount; i++) {
      const randomMedium = categorized.medium[randomInt(0, categorized.medium.length)];
      sequence.push({ ...randomMedium, index: i });
    }

    // Light shuffle for variety
    for (let i = sequence.length - 1; i > 0; i--) {
      if (Math.random() < 0.25) {
        const j = Math.max(0, i - 2);
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
      }
    }

    console.log(`\n📝 Interaction sequence: ${sequence.length} elements`);
    sequence.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.type} [${item.priority}]`);
    });

    // Initialize ShyMouse position
    this.shyMouse.lastPos = {
      x: this.config.browser.viewport.width / 2,
      y: this.config.browser.viewport.height / 4,
    };

    // Execute sequence with ShyMouse
    for (let i = 0; i < sequence.length; i++) {
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed >= duration) break;

      const item = sequence[i];
      const nextItem = sequence[i + 1];

      // Ultra-realistic interaction with ShyMouse
      await this.ultraRealisticInteraction(item.element, item.type, item.index);

      // If there's a next element, swift move to it
      if (nextItem && timeElapsed < duration - 6000) {
        await this.swiftMoveToNext(nextItem.element);
      }
    }

    console.log('\n✅ Ultra-realistic ShyMouse simulation completed');
    this.prioritizer.printSummary();
  }

  async run() {
    try {
      console.log('🚀 Starting ultra-realistic ShyMouse browser session recorder...\n');

      await this.initializeBrowser();
      await this.simulateUltraRealisticBehavior(this.config.sessionDuration);

      console.log('\n🏁 Session completed');
    } catch (error) {
      console.error('❌ Error:', error);
      console.error(error.stack);
    } finally {
      if (this.page) await this.page.close();
      if (this.context) {
        console.log('📹 Saving video...');
        await this.context.close();
      }
      if (this.browser) await this.browser.close();

      await sleep(2000);

      console.log('\n✅ Video saved to ./recordings/');
      console.log('👋 Done!');
    }
  }
}

// Run
const recorder = new UltraRealisticSessionRecorder();
recorder.run();
