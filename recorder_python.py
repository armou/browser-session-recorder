#!/usr/bin/env python3
"""
Ultra-Realistic Browser Session Recorder with Humanization-Playwright
Uses humanization-playwright for ultra-human-like mouse movements
Focus on: chartLabels, recommendations, leaderTitle
"""

import asyncio
import time
from pathlib import Path
from Humanization import Humanization, HumanizationConfig

# Configuration
CONFIG = {
    'url': 'https://app.custom.one/page-result/694ad7fa184497e032fefc1a',
    'session_duration': 60,  # seconds
    'viewport': {'width': 1920, 'height': 1080},

    # Selectors for focus elements
    'selectors': {
        # High priority - FOCUS elements
        'chartLabels': '#screenshot-content svg text',
        'leaderTitle': '#screenshot-content div[style*="font-size: 1.125rem"]',
        'recommendationTexts': '#screenshot-content .line-clamp-1',
        'recommendationItems': '#screenshot-content div[style*="border-radius: 50%"][style*="background-color: rgb(37, 99, 235)"]',

        # Medium priority
        'chartSegments': '#screenshot-content svg path',
        'chartCircles': '#screenshot-content svg circle[r="12"]',
        'avatar': '#screenshot-content img[alt*="Leader"]',
        'badges': '#screenshot-content div[title]',
    },

    # Element priorities
    'priorities': {
        'high': ['chartLabels', 'leaderTitle', 'recommendationTexts', 'recommendationItems'],
        'medium': ['chartSegments', 'chartCircles', 'avatar', 'badges'],
        'skip': ['container', 'dividers'],
    }
}


class ElementPrioritizer:
    """Track and prioritize element interactions"""

    def __init__(self):
        self.interactions = []
        self.element_stats = {}

    def get_priority(self, element_type):
        """Get priority level for element type"""
        if element_type in CONFIG['priorities']['high']:
            return 'high'
        elif element_type in CONFIG['priorities']['medium']:
            return 'medium'
        elif element_type in CONFIG['priorities']['skip']:
            return 'skip'
        return 'low'

    def record_interaction(self, element_type, duration=0, action='hover'):
        """Record an interaction"""
        self.interactions.append({
            'type': element_type,
            'action': action,
            'duration': duration,
            'timestamp': time.time()
        })

        if element_type not in self.element_stats:
            self.element_stats[element_type] = {
                'interactions': 0,
                'avg_hover_time': 0,
                'traced': 0
            }

        stats = self.element_stats[element_type]
        stats['interactions'] += 1
        if duration > 0:
            stats['avg_hover_time'] = (
                (stats['avg_hover_time'] * (stats['interactions'] - 1) + duration) /
                stats['interactions']
            )
        if action == 'trace':
            stats['traced'] += 1

    def print_summary(self):
        """Print interaction summary"""
        print(f"\n📊 Interaction Summary:")
        print(f"  Total interactions: {len(self.interactions)}")

        # Sort by interaction count
        sorted_stats = sorted(
            self.element_stats.items(),
            key=lambda x: x[1]['interactions'],
            reverse=True
        )[:5]

        print("  Top 5 most interacted elements:")
        for idx, (element_type, stats) in enumerate(sorted_stats, 1):
            print(
                f"    {idx}. {element_type}: {stats['interactions']} interactions, "
                f"avg hover {int(stats['avg_hover_time'])}ms, traced {stats['traced']}x"
            )


async def get_element_center(element):
    """Get center position of element"""
    box = await element.bounding_box()
    if not box:
        return None
    return {
        'x': box['x'] + box['width'] / 2,
        'y': box['y'] + box['height'] / 2
    }


async def ultra_realistic_interaction(humanizer, element, element_type, prioritizer):
    """
    Perform ultra-realistic interaction with an element
    Pattern: move → hover → circle/trace → idle → done
    """
    import random

    box = await element.bounding_box()
    if not box:
        return False

    center = {
        'x': box['x'] + box['width'] / 2,
        'y': box['y'] + box['height'] / 2
    }

    print(f"\n🎯 Focusing on {element_type}")

    try:
        # 1. Humanized move to element
        print(f"  → Humanization moving to ({int(center['x'])}, {int(center['y'])})")
        await humanizer.move_to(element)

        # 2. Hover with micro-movements
        hover_duration = random.uniform(1.8, 2.8)
        print(f"  → Hovering for {int(hover_duration * 1000)}ms")

        # Stay on element with small movements
        for _ in range(int(hover_duration * 2.5)):  # ~400ms per step
            offset_x = random.randint(-5, 5)
            offset_y = random.randint(-5, 5)
            await humanizer.move_to(element, offset_x=offset_x, offset_y=offset_y)
            await asyncio.sleep(0.4)

        prioritizer.record_interaction(element_type, hover_duration * 1000, 'hover')

        # 3. Choose action: trace, hover, or nothing
        action = random.random()

        if action < 0.3:
            # Trace outline
            print(f"  → Tracing element outline")
            corners = [
                (box['x'], box['y']),
                (box['x'] + box['width'], box['y']),
                (box['x'] + box['width'], box['y'] + box['height']),
                (box['x'], box['y'] + box['height']),
            ]

            for x, y in corners:
                await humanizer.page.mouse.move(x, y)
                await asyncio.sleep(random.uniform(0.1, 0.2))

            prioritizer.record_interaction(element_type, 0, 'trace')

        # 4. Idle - micro movements (reading simulation)
        idle_duration = random.uniform(2.2, 4.2)
        print(f"  → Idling for {int(idle_duration * 1000)}ms")

        idle_x = center['x'] + random.randint(-25, 25)
        idle_y = center['y'] + random.randint(10, 35)

        await humanizer.page.mouse.move(idle_x, idle_y)

        # Very small movements during idle
        start_time = time.time()
        while time.time() - start_time < idle_duration:
            micro_x = idle_x + random.randint(-3, 3)
            micro_y = idle_y + random.randint(-3, 3)
            await humanizer.page.mouse.move(micro_x, micro_y)
            await asyncio.sleep(random.uniform(0.25, 0.4))

        return True

    except Exception as e:
        print(f"  ⚠️  Interaction failed: {e}")
        return False


async def main():
    """Main recorder function"""
    import random

    print("🚀 Starting ultra-realistic Humanization-Playwright session recorder...\n")

    # Configure humanization (slow, highly humanized)
    config = HumanizationConfig(
        fast=False,
        humanize=True,
        characters_per_minute=400,
        backspace_cpm=800,
        timeout=10000,
        stealth_mode=True
    )

    # Create prioritizer
    prioritizer = ElementPrioritizer()

    print("🌐 Launching browser with Patchright (undetected)...")

    # Launch browser context
    from patchright.async_api import async_playwright

    async with async_playwright() as p:
        # Launch with video recording
        browser = await p.chromium.launch(
            headless=False,
            args=[
                '--start-maximized',
                '--disable-blink-features=AutomationControlled',
            ]
        )

        # Create context with recording
        recordings_dir = Path(__file__).parent / 'recordings'
        recordings_dir.mkdir(exist_ok=True)

        context = await browser.new_context(
            viewport=CONFIG['viewport'],
            record_video_dir=str(recordings_dir),
            record_video_size=CONFIG['viewport'],
        )

        page = await context.new_page()

        # Initialize Humanization
        humanizer = Humanization(page, config)

        print(f"🌐 Navigating to: {CONFIG['url']}")
        await page.goto(CONFIG['url'], wait_until='networkidle')
        await asyncio.sleep(3)

        print("✅ Page loaded")
        print("📹 Video recording started\n")

        # Get all target elements
        print("🖱️  Starting ultra-realistic simulation...\n")

        elements_by_type = {}

        for element_type, selector in CONFIG['selectors'].items():
            try:
                found = await page.query_selector_all(selector)
                if found:
                    elements_by_type[element_type] = found
                    print(f"🎯 Found {len(found)} elements for \"{element_type}\"")
            except Exception as e:
                pass

        # Categorize elements
        categorized = {'high': [], 'medium': [], 'low': []}

        for element_type, elements in elements_by_type.items():
            priority = prioritizer.get_priority(element_type)
            if priority == 'skip':
                continue

            for idx, element in enumerate(elements):
                categorized[priority].append({
                    'element': element,
                    'type': element_type,
                    'index': idx,
                    'priority': priority
                })

        print(f"\n📊 Focus elements: {len(categorized['high'])} high-priority, "
              f"{len(categorized['medium'])} medium-priority, "
              f"{len(categorized['low'])} low-priority")

        # Create sequence: mostly high-priority
        sequence = []
        sequence.extend(categorized['high'])

        # Add some medium elements
        if categorized['medium']:
            sequence.extend(random.sample(
                categorized['medium'],
                min(2, len(categorized['medium']))
            ))

        # Light shuffle
        for i in range(len(sequence) - 1, 0, -1):
            if random.random() < 0.25:
                j = max(0, i - 2)
                sequence[i], sequence[j] = sequence[j], sequence[i]

        print(f"\n📝 Interaction sequence: {len(sequence)} elements")
        for idx, item in enumerate(sequence, 1):
            print(f"   {idx}. {item['type']} [{item['priority']}]")

        # Execute sequence
        start_time = time.time()

        for i, item in enumerate(sequence):
            elapsed = time.time() - start_time
            if elapsed >= CONFIG['session_duration']:
                break

            # Perform interaction
            await ultra_realistic_interaction(
                humanizer,
                item['element'],
                item['type'],
                prioritizer
            )

            # Swift move to next element
            if i < len(sequence) - 1 and elapsed < CONFIG['session_duration'] - 6:
                print(f"  ⚡ Swift move to next element...")
                await asyncio.sleep(random.uniform(0.4, 0.8))
                next_element = sequence[i + 1]['element']
                await humanizer.move_to(next_element)

        print("\n✅ Ultra-realistic Humanization simulation completed")
        prioritizer.print_summary()

        print("\n🏁 Session completed")
        print("📹 Saving video...")

        await page.close()
        await context.close()
        await browser.close()

        await asyncio.sleep(2)

        print("\n✅ Video saved to ./recordings/")
        print("👋 Done!")


if __name__ == '__main__':
    asyncio.run(main())
