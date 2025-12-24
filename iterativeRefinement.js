/**
 * Iterative Refinement System
 * Learns and prioritizes the most interesting elements on the page
 */

export class ElementPrioritizer {
  constructor() {
    this.elementStats = new Map();
    this.interactions = [];
  }

  /**
   * Categorize elements by type and importance
   */
  categorizeElements(elements, selectors) {
    const categorized = {
      high: [],      // Focus elements: chartLabels, recommendations, leaderTitle
      medium: [],    // Secondary: chart segments, circles, avatar, badges
      low: [],       // Other elements
    };

    for (const [key, elementList] of Object.entries(elements)) {
      const priority = this.getPriority(key, selectors);

      // Skip elements marked as 'skip'
      if (priority === 'skip') continue;

      elementList.forEach(element => {
        const item = { element, type: key, priority };

        if (priority === 'high') categorized.high.push(item);
        else if (priority === 'medium') categorized.medium.push(item);
        else categorized.low.push(item);

        // Track stats
        if (!this.elementStats.has(key)) {
          this.elementStats.set(key, {
            interactions: 0,
            avgHoverTime: 0,
            traced: 0,
          });
        }
      });
    }

    return categorized;
  }

  /**
   * Determine priority based on selector type
   */
  getPriority(selectorKey, selectors) {
    // FOCUS ELEMENTS: chartLabels, recommendations, leaderTitle
    const highPriority = [
      'chartLabels',      // Labels on the chart (Organisation, Créativité, etc.)
      'leaderTitle',      // "Leader Effacé" title
      'recommendationTexts', // Recommendation text items
      'recommendationItems', // Recommendation numbered circles
    ];

    const mediumPriority = [
      'chartSegments',    // Chart colored segments
      'chartCircles',     // Interactive circles on chart
      'avatar',           // Avatar image
      'badges',           // Top badges
    ];

    const skip = [
      'container',        // Skip the overall container
      'dividers',         // Skip divider lines
    ];

    if (skip.includes(selectorKey)) return 'skip';
    if (highPriority.includes(selectorKey)) return 'high';
    if (mediumPriority.includes(selectorKey)) return 'medium';
    return 'low';
  }

  /**
   * Record an interaction
   */
  recordInteraction(type, element, duration = 0, action = 'hover') {
    this.interactions.push({
      type,
      action,
      duration,
      timestamp: Date.now(),
    });

    const stats = this.elementStats.get(type);
    if (stats) {
      stats.interactions++;
      if (duration > 0) {
        stats.avgHoverTime =
          (stats.avgHoverTime * (stats.interactions - 1) + duration) /
          stats.interactions;
      }
      if (action === 'trace') {
        stats.traced++;
      }
    }
  }

  /**
   * Get weighted random element based on priority and stats
   */
  getWeightedRandomElement(categorized) {
    const weights = {
      high: 50,
      medium: 30,
      low: 20,
    };

    // Adjust weights based on interaction history
    const totalInteractions = this.interactions.length;
    if (totalInteractions > 10) {
      // Start focusing more on high-priority elements
      weights.high = 60;
      weights.medium = 25;
      weights.low = 15;
    }
    if (totalInteractions > 20) {
      // Even more focus on important elements
      weights.high = 70;
      weights.medium = 20;
      weights.low = 10;
    }

    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const [priority, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand <= cumulative && categorized[priority].length > 0) {
        const items = categorized[priority];
        return items[Math.floor(Math.random() * items.length)];
      }
    }

    // Fallback
    const allItems = [
      ...categorized.high,
      ...categorized.medium,
      ...categorized.low,
    ];
    return allItems[Math.floor(Math.random() * allItems.length)];
  }

  /**
   * Get interaction statistics
   */
  getStats() {
    const stats = {};
    for (const [type, data] of this.elementStats.entries()) {
      stats[type] = {
        ...data,
        avgHoverTime: Math.round(data.avgHoverTime),
      };
    }
    return stats;
  }

  /**
   * Suggest next action based on history
   */
  suggestNextAction() {
    const recent = this.interactions.slice(-5);
    const recentActions = recent.map(i => i.action);

    // If we haven't traced anything recently, suggest tracing
    if (!recentActions.includes('trace') && Math.random() < 0.4) {
      return 'trace';
    }

    // If we haven't made circles recently, suggest it
    if (!recentActions.includes('circle') && Math.random() < 0.3) {
      return 'circle';
    }

    // Default: hover
    return 'hover';
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n📊 Interaction Summary:');
    console.log(`  Total interactions: ${this.interactions.length}`);

    const stats = this.getStats();
    const sortedStats = Object.entries(stats)
      .sort((a, b) => b[1].interactions - a[1].interactions)
      .slice(0, 5);

    console.log('  Top 5 most interacted elements:');
    sortedStats.forEach(([type, data], idx) => {
      console.log(
        `    ${idx + 1}. ${type}: ${data.interactions} interactions, ` +
          `avg hover ${data.avgHoverTime}ms, traced ${data.traced}x`
      );
    });
  }
}
