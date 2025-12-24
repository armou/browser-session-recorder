# Browser Session Recorder

Advanced browser automation tool that records human-like mouse movements with FFmpeg integration.

## Features

✨ **Human-like Mouse Movements**
- Bezier curves for natural movement paths
- Variable speed with easing functions
- Micro-movements and wobble effects
- Random pauses and timing

🎯 **Precision Element Targeting**
- Custom CSS selectors for specific elements
- Hover over score rings, graphs, titles, etc.
- Trace element outlines
- Circular motion patterns

📹 **Screen Recording**
- FFmpeg integration for high-quality video capture
- Configurable FPS, codec, and quality settings
- Automatic timestamped output files

⚙️ **Highly Configurable**
- Easy-to-edit configuration file
- Customizable mouse behavior parameters
- Flexible element selector system

## Prerequisites

1. **Node.js** (v16 or higher)
2. **FFmpeg** installed on your system

### Installing FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Configuration

Edit `config.js` to customize your recording session:

### URL and Duration
```javascript
url: 'https://your-target-site.com',
sessionDuration: 60000, // 1 minute
```

### Element Selectors
Define specific elements to target:
```javascript
selectors: {
  title: 'h1, [class*="title"]',
  scoreRings: '[class*="score"], [class*="ring"]',
  graphs: '[class*="chart"], canvas, svg',
  // Add your own selectors
}
```

### Mouse Behavior
Fine-tune the mouse movements:
```javascript
mouseBehavior: {
  speedMin: 5,
  speedMax: 15,
  pauseMin: 500,
  pauseMax: 2000,
  hoverDurationMin: 1000,
  hoverDurationMax: 3000,
  circleMotionProbability: 0.3,
  traceOutlineProbability: 0.4,
}
```

### Recording Settings
```javascript
recording: {
  enabled: true,
  fps: 30,
  outputDir: './recordings',
  videoCodec: 'libx264',
  preset: 'medium', // faster = lower quality, slower = higher quality
}
```

## Usage

Run the recorder:
```bash
npm start
```

Or directly:
```bash
node index.js
```

The script will:
1. Start FFmpeg screen recording
2. Launch browser and navigate to your URL
3. Simulate human-like mouse movements for the configured duration
4. Target specific elements based on your selectors
5. Save the recording to `./recordings/session-[timestamp].mp4`

## How It Works

### 1. Element Detection
The script scans the page for elements matching your configured selectors:
- Titles and headings
- Score rings and visual indicators
- Graphs and charts
- Interactive elements

### 2. Movement Patterns
Various natural movement patterns:
- **Bezier curves**: Smooth, curved paths instead of straight lines
- **Hover with wobble**: Micro-movements while hovering over elements
- **Outline tracing**: Following the edges of elements
- **Circular motions**: Drawing circles at random locations
- **Random scrolling**: Occasional page scrolls

### 3. Timing and Pauses
Human-like timing:
- Random pauses between actions (500-2000ms)
- Variable hover duration (1-3 seconds)
- Natural acceleration/deceleration

### 4. Recording
FFmpeg captures the entire screen while the automation runs, creating a high-quality video of the session.

## Advanced Usage

### Custom Actions

You can extend the `BrowserSessionRecorder` class:

```javascript
import BrowserSessionRecorder from './index.js';

class CustomRecorder extends BrowserSessionRecorder {
  async simulateHumanBehavior(duration) {
    // Your custom behavior here
    await super.simulateHumanBehavior(duration);
  }
}

const recorder = new CustomRecorder();
recorder.run();
```

### Element-Specific Interactions

Modify `config.js` selectors to target your specific page structure:

```javascript
selectors: {
  // Target specific score rings by class
  performanceScore: '.score-ring.performance',
  accessibilityScore: '.score-ring.accessibility',

  // Target specific chart types
  barChart: 'canvas[aria-label*="bar chart"]',
  lineGraph: 'svg.line-graph',

  // Any custom elements
  customElement: '#my-custom-element',
}
```

## Troubleshooting

### FFmpeg not found
Ensure FFmpeg is installed and in your PATH:
```bash
ffmpeg -version
```

### Recording on different platforms

**Linux:**
Change FFmpeg args in `index.js`:
```javascript
'-f', 'x11grab',
'-i', ':0.0',
```

**Windows:**
```javascript
'-f', 'gdigrab',
'-i', 'desktop',
```

### No elements found
Check your selectors in `config.js`. Inspect your target page to find the correct CSS selectors.

### Video quality

Adjust the FFmpeg preset in `config.js`:
- `ultrafast` - Fastest encoding, larger file size
- `medium` - Balanced (default)
- `veryslow` - Best quality, slower encoding

## Examples

### Example 1: E-commerce Product Page
```javascript
selectors: {
  productTitle: 'h1.product-title',
  priceTag: '.price',
  addToCart: 'button[data-testid="add-to-cart"]',
  productImages: '.product-gallery img',
  reviews: '.review-item',
}
```

### Example 2: Dashboard Analytics
```javascript
selectors: {
  kpiCards: '[class*="kpi-card"]',
  charts: 'canvas, svg[class*="chart"]',
  dataTable: 'table.data-table',
  filterButtons: '[role="tab"]',
}
```

## License

MIT

## Credits

Built with:
- [Playwright](https://playwright.dev/) - Browser automation
- [FFmpeg](https://ffmpeg.org/) - Video recording
