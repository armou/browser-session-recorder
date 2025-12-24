#!/usr/bin/env node

/**
 * Browser Session Recorder with Playwright's Native Video Recording
 * Uses Playwright's built-in video recording instead of FFmpeg
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { config } from './config.js';
import {
  moveMouse,
  moveInCircle,
  traceElementOutline,
  hoverElement,
  randomScroll,
  getRandomViewportPosition,
  initializeMouseTracking,
  sleep,
  random,
  randomInt,
} from './mouseUtils.js';
import {
  injectCursorOverlay,
  updateCursorPosition,
  animateClick,
  highlightElement,
} from './cursorOverlay.js';
import { ElementPrioritizer } from './iterativeRefinement.js';

class BrowserSessionRecorder {
  constructor(configuration = config) {
    this.config = configuration;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.mousePosition = { x: 0, y: 0 };
    this.prioritizer = new ElementPrioritizer();
  }

  /**
   * Initialize browser with video recording
   */
  async initializeBrowser() {
    console.log('🌐 Launching browser with video recording...');

    // Create recordings directory
    if (!existsSync('./recordings')) {
      mkdirSync('./recordings', { recursive: true });
    }

    this.browser = await chromium.launch({
      headless: false,
      slowMo: this.config.browser.slowMo,
    });

    // Create context with video recording enabled
    this.context = await this.browser.newContext({
      viewport: this.config.browser.viewport,
      recordVideo: {
        dir: './recordings/',
        size: this.config.browser.viewport,
      },
    });

    this.page = await this.context.newPage();

    // Initialize mouse tracking
    await initializeMouseTracking(this.page);

    console.log(`🌐 Navigating to: ${this.config.url}`);
    await this.page.goto(this.config.url, { waitUntil: 'networkidle' });

    // Wait for page to fully load
    await sleep(3000);

    // Inject custom cursor overlay
    console.log('🎨 Injecting custom cursor...');
    await injectCursorOverlay(this.page);

    console.log('✅ Page loaded');
    console.log('📹 Video recording started automatically');
  }

  /**
   * Get all elements matching the configured selectors
   */
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
        console.log(`⚠️  No elements found for "${key}"`);
      }
    }

    return elements;
  }

  /**
   * Perform human-like mouse movements on the page
   */
  async simulateHumanBehavior(duration) {
    console.log(`🖱️  Starting mouse simulation for ${duration / 1000} seconds...`);

    const startTime = Date.now();
    const elements = await this.getTargetElements();
    const allElements = Object.values(elements).flat();

    if (allElements.length === 0) {
      console.log('⚠️  No target elements found, using random movements');
    }

    // Categorize elements by priority
    const categorized = this.prioritizer.categorizeElements(
      elements,
      this.config.selectors
    );

    console.log(
      `📊 Found ${categorized.high.length} high-priority, ` +
        `${categorized.medium.length} medium-priority, ` +
        `${categorized.low.length} low-priority elements`
    );

    let currentPos = await getRandomViewportPosition(this.page);
    this.mousePosition = currentPos;

    while (Date.now() - startTime < duration) {
      const timeRemaining = duration - (Date.now() - startTime);
      if (timeRemaining < 1000) break;

      // Get suggested action from prioritizer
      const suggestedAction = this.prioritizer.suggestNextAction();
      const action = randomInt(1, 6);

      try {
        if (allElements.length > 0 && action <= 4) {
          // 66% chance: Interact with a target element
          const selectedItem = this.prioritizer.getWeightedRandomElement(categorized);
          if (!selectedItem) continue;

          const randomElement = selectedItem.element;
          const elementType = selectedItem.type;
          const box = await randomElement.boundingBox();

          if (box) {
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;

            console.log(`  → Moving to element at (${Math.round(centerX)}, ${Math.round(centerY)})`);

            // Move to element
            await moveMouse(
              this.page,
              this.mousePosition.x,
              this.mousePosition.y,
              centerX,
              centerY,
              randomInt(50, 100)
            );

            // Update custom cursor position
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
              }, randomElement);

              await highlightElement(this.page, selector, 800);
            } catch (e) {
              // Highlight failed, continue
            }

            // Hover with micro-movements
            const hoverDuration = random(
              this.config.mouseBehavior.hoverDurationMin,
              this.config.mouseBehavior.hoverDurationMax
            );
            console.log(`  → Hovering for ${Math.round(hoverDuration)}ms on ${elementType} [${selectedItem.priority}]`);
            await hoverElement(this.page, randomElement, hoverDuration, true);

            // Record interaction
            this.prioritizer.recordInteraction(elementType, randomElement, hoverDuration, 'hover');

            // Maybe trace outline
            const traceProbability =
              selectedItem.priority === 'high'
                ? this.config.mouseBehavior.traceOutlineProbability * 1.5
                : this.config.mouseBehavior.traceOutlineProbability;

            if (suggestedAction === 'trace' || Math.random() < traceProbability) {
              console.log('  → Tracing element outline');
              await traceElementOutline(this.page, randomElement, 3);
              this.prioritizer.recordInteraction(elementType, randomElement, 0, 'trace');
            }
          }
        } else if (
          (action === 4 && Math.random() < this.config.mouseBehavior.circleMotionProbability) ||
          suggestedAction === 'circle'
        ) {
          // Draw a circle
          const radius = random(
            this.config.mouseBehavior.circleRadiusMin,
            this.config.mouseBehavior.circleRadiusMax
          );
          console.log(`  → Drawing circle (radius: ${Math.round(radius)}px)`);
          await moveInCircle(
            this.page,
            this.mousePosition.x,
            this.mousePosition.y,
            radius,
            randomInt(30, 50)
          );
          this.prioritizer.recordInteraction('general', null, 0, 'circle');
        } else {
          // Move to random position
          const newPos = await getRandomViewportPosition(this.page);
          console.log(`  → Moving to random position (${Math.round(newPos.x)}, ${Math.round(newPos.y)})`);

          await moveMouse(
            this.page,
            this.mousePosition.x,
            this.mousePosition.y,
            newPos.x,
            newPos.y,
            randomInt(60, 100)
          );

          this.mousePosition = newPos;
        }

        // Random pause
        const pauseDuration = random(
          this.config.mouseBehavior.pauseMin,
          this.config.mouseBehavior.pauseMax
        );
        console.log(`  → Pausing for ${Math.round(pauseDuration)}ms`);
        await sleep(pauseDuration);

        // Occasional scroll
        if (Math.random() < 0.2) {
          console.log('  → Scrolling');
          await randomScroll(this.page, Math.random() > 0.5 ? 'down' : 'up');
        }
      } catch (error) {
        console.log(`  ⚠️  Action failed: ${error.message}`);
      }
    }

    console.log('✅ Mouse simulation completed');
    this.prioritizer.printSummary();
  }

  /**
   * Run the complete recording session
   */
  async run() {
    try {
      console.log('🚀 Starting browser session recorder...\n');

      // Initialize browser and navigate to page
      await this.initializeBrowser();

      // Run mouse simulation
      await this.simulateHumanBehavior(this.config.sessionDuration);

      console.log('\n🏁 Session completed');
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      // Close and save video
      if (this.page) await this.page.close();
      if (this.context) {
        console.log('📹 Saving video...');
        await this.context.close();
      }
      if (this.browser) await this.browser.close();

      // Wait for video to be saved
      await sleep(2000);

      console.log('\n✅ Video saved to ./recordings/');
      console.log('👋 Done!');
    }
  }
}

// Run
const recorder = new BrowserSessionRecorder();
recorder.run();
