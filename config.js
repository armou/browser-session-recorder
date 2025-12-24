/**
 * Configuration for browser session recording
 */

export const config = {
  // Target URL
  url: 'https://app.custom.one/page-result/694ad7fa184497e032fefc1a',

  // Session duration in milliseconds
  sessionDuration: 60000, // 1 minute

  // Browser settings
  browser: {
    headless: false,
    viewport: { width: 1920, height: 1080 },
    slowMo: 0, // Slow down operations by ms (useful for debugging)
  },

  // FFmpeg recording settings
  recording: {
    enabled: true,
    fps: 30,
    outputDir: './recordings',
    videoCodec: 'libx264',
    pixelFormat: 'yuv420p',
    preset: 'medium', // ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
  },

  // Element selectors to target for mouse movements
  // Specific selectors for Custom.one diagnostic page
  selectors: {
    // Main container
    container: '#screenshot-content',

    // Page title - "Quel est ton type de Leader Adaptatif ?"
    title: '#screenshot-content p[contenteditable="true"][style*="font-size: 1.5rem"]',

    // Badges at the top (Manager d'équipe, Relationnel, J'execute rapidement)
    badges: '#screenshot-content div[title]',

    // The SVG pie chart/ring
    chartSvg: '#screenshot-content svg',

    // Individual segments of the chart (path elements)
    chartSegments: '#screenshot-content svg path',

    // Circles in the chart (interactive points)
    chartCircles: '#screenshot-content svg circle[r="12"]',

    // Text labels on the chart (Organisation, Créativité, etc.)
    chartLabels: '#screenshot-content svg text',

    // Avatar image
    avatar: '#screenshot-content img[alt*="Leader"]',

    // Leader type title
    leaderTitle: '#screenshot-content div[style*="font-size: 1.125rem"]',

    // Leader description text
    leaderDescription: '#screenshot-content .line-clamp-3',

    // Recommendations section title
    recommendationsTitle: '#screenshot-content p[contenteditable="true"]:has-text("Recommandations")',

    // Individual recommendation items (numbered 1, 2, 3)
    recommendationItems: '#screenshot-content div[style*="border-radius: 50%"][style*="background-color: rgb(37, 99, 235)"]',

    // Recommendation text
    recommendationTexts: '#screenshot-content .line-clamp-1',

    // Divider lines
    dividers: '#screenshot-content p[contenteditable="true"][style*="color: gray"]',
  },

  // Mouse movement behavior
  mouseBehavior: {
    // Speed range (pixels per step)
    speedMin: 5,
    speedMax: 15,

    // Pause duration range (ms)
    pauseMin: 500,
    pauseMax: 2000,

    // Hover duration on elements (ms)
    hoverDurationMin: 1000,
    hoverDurationMax: 3000,

    // Probability of making circular motion (0-1)
    circleMotionProbability: 0.3,

    // Circle radius range
    circleRadiusMin: 30,
    circleRadiusMax: 100,

    // Trace element outline probability (0-1)
    traceOutlineProbability: 0.4,
  },
};
