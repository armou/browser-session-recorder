#!/usr/bin/env node

/**
 * Focused Browser Session Recorder
 * Deliberate interactions: hover → circle → idle → swift move
 * Focus on: chartLabels, recommendations, leaderTitle
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { config } from './config.js';
import {
  moveMouse,
  traceElementOutline,
  sleep,
  random,
  randomInt,
  idleMovement,
  swiftMoveTo,
  circleAroundElement,
} from './mouseUtils.js';
import {
  injectCursorOverlay,
  updateCursorPosition,
  highlightElement,
} from './cursorOverlay.js';
import { ElementPrioritizer } from './iterativeRefinement.js';

class FocusedSessionRecorder {
  constructor(configuration = config) {
    this.config = configuration;
    this.browser = null;
    this.context = null;
    this.page = null;
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

    console.log(`🌐 Navigating to: ${this.config.url}`);
    await this.page.goto(this.config.url, { waitUntil: 'networkidle' });
    await sleep(3000);

    console.log('🎨 Injecting custom cursor...');
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
   * Perform focused interaction with a single element
   * Pattern: hover → circle/trace → idle → done
   */
  async focusedInteraction(element, elementType, elementIndex = 0) {
    const box = await element.boundingBox();
    if (!box) return false;

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    console.log(`\n🎯 Focusing on ${elementType} #${elementIndex}`);

    // 1. Move to element (smooth approach)
    console.log(`  → Moving to element at (${Math.round(centerX)}, ${Math.round(centerY)})`);
    await moveMouse(
      this.page,
      this.mousePosition.x,
      this.mousePosition.y,
      centerX,
      centerY,
      randomInt(60, 90)
    );

    await updateCursorPosition(this.page, centerX, centerY);
    this.mousePosition = { x: centerX, y: centerY };

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
      // Continue if highlight fails
    }

    // 2. Hover with small movements
    const hoverDuration = random(1500, 2500);
    console.log(`  → Hovering for ${Math.round(hoverDuration)}ms`);

    const hoverSteps = Math.floor(hoverDuration / 300);
    for (let i = 0; i < hoverSteps; i++) {
      const wobbleX = centerX + random(-5, 5);
      const wobbleY = centerY + random(-5, 5);
      await this.page.mouse.move(wobbleX, wobbleY);
      await sleep(300);
    }

    this.prioritizer.recordInteraction(elementType, element, hoverDuration, 'hover');

    // 3. Choose action: circle around OR trace outline (50/50)
    if (Math.random() < 0.5) {
      const radius = random(35, 55);
      console.log(`  → Circling around (radius: ${Math.round(radius)}px)`);
      await circleAroundElement(this.page, centerX, centerY, radius);
      this.prioritizer.recordInteraction(elementType, element, 0, 'circle');
    } else {
      console.log(`  → Tracing element outline`);
      await traceElementOutline(this.page, element, 3);
      this.prioritizer.recordInteraction(elementType, element, 0, 'trace');
    }

    // 4. Idle movement - barely moving, like reading
    const idleDuration = random(2000, 4000);
    console.log(`  → Idling nearby for ${Math.round(idleDuration)}ms`);

    // Position slightly offset from center for idle
    const idleX = centerX + random(-20, 20);
    const idleY = centerY + random(10, 30);

    await this.page.mouse.move(idleX, idleY, { steps: 10 });
    await idleMovement(this.page, idleX, idleY, idleDuration);

    // Update position after idle
    this.mousePosition = { x: idleX, y: idleY };

    return true;
  }

  /**
   * Main simulation with focused interactions
   */
  async simulateFocusedBehavior(duration) {
    console.log(`🖱️  Starting focused simulation for ${duration / 1000} seconds...`);

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

    // Create prioritized sequence: 80% high-priority, 20% medium
    const sequence = [];

    // Add all high-priority elements
    categorized.high.forEach((item, idx) => {
      sequence.push({ ...item, index: idx });
    });

    // Add some medium-priority elements
    const mediumCount = Math.min(3, categorized.medium.length);
    for (let i = 0; i < mediumCount; i++) {
      const randomMedium = categorized.medium[randomInt(0, categorized.medium.length)];
      sequence.push({ ...randomMedium, index: i });
    }

    // Shuffle sequence slightly while keeping high-priority bias
    for (let i = sequence.length - 1; i > 0; i--) {
      if (Math.random() < 0.3) { // Only 30% chance to shuffle
        const j = Math.max(0, i - 2); // Only swap with nearby elements
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
      }
    }

    console.log(`\n📝 Interaction sequence: ${sequence.length} elements`);
    sequence.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.type} [${item.priority}]`);
    });

    // Start from a random position
    this.mousePosition = {
      x: this.config.browser.viewport.width / 2,
      y: this.config.browser.viewport.height / 4,
    };

    // Execute sequence
    for (let i = 0; i < sequence.length; i++) {
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed >= duration) break;

      const item = sequence[i];
      const nextItem = sequence[i + 1];

      // Focused interaction
      await this.focusedInteraction(item.element, item.type, item.index);

      // If there's a next element, swift move to it
      if (nextItem && timeElapsed < duration - 5000) {
        const nextBox = await nextItem.element.boundingBox();
        if (nextBox) {
          const nextX = nextBox.x + nextBox.width / 2;
          const nextY = nextBox.y + nextBox.height / 2;

          console.log(`  ⚡ Swift move to next element...`);
          await sleep(random(300, 600)); // Brief pause before moving

          await swiftMoveTo(
            this.page,
            this.mousePosition.x,
            this.mousePosition.y,
            nextX,
            nextY
          );

          await updateCursorPosition(this.page, nextX, nextY);
          this.mousePosition = { x: nextX, y: nextY };
        }
      }
    }

    console.log('\n✅ Focused simulation completed');
    this.prioritizer.printSummary();
  }

  async run() {
    try {
      console.log('🚀 Starting focused browser session recorder...\n');

      await this.initializeBrowser();
      await this.simulateFocusedBehavior(this.config.sessionDuration);

      console.log('\n🏁 Session completed');
    } catch (error) {
      console.error('❌ Error:', error);
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
const recorder = new FocusedSessionRecorder();
recorder.run();
