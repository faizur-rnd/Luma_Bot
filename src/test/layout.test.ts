// Layout & Viewport Collision Verification Tests
// Verifies bounding rectangles of the Orb Box and Conversation Transcript
// never intersect at viewports: 320px, 360px, 390px, 768px, 1024px, 1440px.

export interface ViewportLayoutTestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

function doRectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
}

export function computeTalkScreenLayout(viewportWidth: number, viewportHeight: number, messageCount: number): {
  orbRect: Rect;
  conversationRect: Rect;
  controlsRect: Rect;
} {
  const headerHeight = 64;
  const contentHeight = viewportHeight - headerHeight;

  if (viewportWidth >= 1024) {
    // Desktop Two-Column Layout (5/12 orb left, 7/12 conversation right)
    const orbColWidth = Math.round(viewportWidth * (5 / 12));
    const convColWidth = viewportWidth - orbColWidth;

    const orbSize = Math.min(320, orbColWidth - 48);
    const orbRect: Rect = {
      left: 24,
      right: 24 + orbSize,
      top: headerHeight + 24,
      bottom: headerHeight + 24 + orbSize,
      width: orbSize,
      height: orbSize
    };

    const controlsHeight = 72;
    const convRect: Rect = {
      left: orbColWidth + 24,
      right: viewportWidth - 24,
      top: headerHeight + 16,
      bottom: headerHeight + contentHeight - controlsHeight - 16,
      width: convColWidth - 48,
      height: contentHeight - controlsHeight - 32
    };

    const controlsRect: Rect = {
      left: orbColWidth + 24,
      right: viewportWidth - 24,
      top: headerHeight + contentHeight - controlsHeight,
      bottom: headerHeight + contentHeight,
      width: convColWidth - 48,
      height: controlsHeight
    };

    return { orbRect, conversationRect: convRect, controlsRect };
  } else {
    // Mobile / Tablet Stacked Layout
    // As messages grow (> 2), orb shrinks to compact 96px status orb
    const isCompact = messageCount > 2;
    const orbHeight = isCompact ? 96 : Math.min(320, Math.max(180, Math.round(viewportHeight * 0.32)));
    const controlsHeight = 80;

    const orbRect: Rect = {
      left: 16,
      right: viewportWidth - 16,
      top: headerHeight + 12,
      bottom: headerHeight + 12 + orbHeight,
      width: viewportWidth - 32,
      height: orbHeight
    };

    const convTop = orbRect.bottom + 8;
    const convBottom = viewportHeight - controlsHeight - 8;
    const convHeight = Math.max(0, convBottom - convTop);

    const convRect: Rect = {
      left: 16,
      right: viewportWidth - 16,
      top: convTop,
      bottom: convBottom,
      width: viewportWidth - 32,
      height: convHeight
    };

    const controlsRect: Rect = {
      left: 0,
      right: viewportWidth,
      top: viewportHeight - controlsHeight,
      bottom: viewportHeight,
      width: viewportWidth,
      height: controlsHeight
    };

    return { orbRect, conversationRect: convRect, controlsRect };
  }
}

export async function runLayoutTests(): Promise<ViewportLayoutTestResult[]> {
  const results: ViewportLayoutTestResult[] = [];
  const viewports = [
    { width: 320, height: 568, name: 'Mobile XS (320px)' },
    { width: 360, height: 640, name: 'Mobile S (360px)' },
    { width: 390, height: 844, name: 'Mobile M (390px - iPhone 13/14)' },
    { width: 768, height: 1024, name: 'Tablet (768px - iPad)' },
    { width: 1024, height: 768, name: 'Desktop Small (1024px)' },
    { width: 1440, height: 900, name: 'Desktop Large (1440px)' }
  ];

  for (const vp of viewports) {
    for (const msgCount of [0, 1, 5, 12]) {
      const mode = msgCount > 2 ? 'Active Chat' : 'Initial Screen';
      const testName = `${vp.name} [${mode}]: Orb box and Conversation transcript never overlap`;
      try {
        const { orbRect, conversationRect, controlsRect } = computeTalkScreenLayout(vp.width, vp.height, msgCount);

        // 1. Orb must not intersect conversation
        if (doRectsIntersect(orbRect, conversationRect)) {
          throw new Error(`Orb box (${JSON.stringify(orbRect)}) overlaps Conversation (${JSON.stringify(conversationRect)})`);
        }

        // 2. Conversation must not intersect bottom controls
        if (doRectsIntersect(conversationRect, controlsRect)) {
          throw new Error(`Conversation overlaps Bottom Controls`);
        }

        // 3. Orb must not intersect bottom controls
        if (doRectsIntersect(orbRect, controlsRect)) {
          throw new Error(`Orb overlaps Bottom Controls`);
        }

        // 4. Positive areas
        if (orbRect.height <= 0 || orbRect.width <= 0) {
          throw new Error('Orb box has invalid dimensions');
        }

        results.push({
          suite: 'Layout & Overlap Prevention',
          name: testName,
          passed: true
        });
      } catch (e: any) {
        results.push({
          suite: 'Layout & Overlap Prevention',
          name: testName,
          passed: false,
          error: e?.message || String(e)
        });
      }
    }
  }

  return results;
}
