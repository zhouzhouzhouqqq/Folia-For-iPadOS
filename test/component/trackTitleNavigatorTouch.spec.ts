import { expect, test } from './fixtures';

// Actual player bar under touch/no-hover and native-iPad pointer capabilities; synthetic queue, no account or network.
test.use({ browserName: 'webkit', hasTouch: true, viewport: { width: 1024, height: 768 }, launchOptions: { args: [] } });

test('touch playback exposes both 44px switches without hovering and respects queue boundaries', async ({ mount, page }) => {
    await mount('trackTitleNavigator');
    const previous = page.getByRole('button', { name: 'Previous track' });
    const next = page.getByRole('button', { name: 'Next track' });
    const probe = page.locator('[data-probe-track]');
    for (const button of [previous, next]) {
        await expect(button).toBeVisible();
        await expect(button).toBeEnabled();
        await expect.poll(() => button.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.3);
        const rect = await button.boundingBox();
        expect(rect!.width).toBeGreaterThanOrEqual(44);
        expect(rect!.height).toBeGreaterThanOrEqual(44);
    }
    await next.tap();
    await expect(probe).toHaveAttribute('data-probe-track', 'Charlie Song');
    await expect(probe).toHaveAttribute('data-probe-navigation', '0');
    await next.tap();
    await expect(probe).toHaveAttribute('data-probe-track', 'Delta Song');
    await expect(next).toBeDisabled();
    await previous.tap();
    await expect(probe).toHaveAttribute('data-probe-track', 'Charlie Song');
    await previous.tap();
    await expect(probe).toHaveAttribute('data-probe-track', 'Bravo Song');
    await previous.tap();
    await expect(probe).toHaveAttribute('data-probe-track', 'Alpha Song');
    await expect(previous).toBeDisabled();
    await expect(probe).toHaveAttribute('data-probe-navigation', '0');
    await page.screenshot({ path: 'docs/ipados-validation/track-switch-landscape.png', fullPage: true });
    for (const size of [{ width: 768, height: 1024 }, { width: 375, height: 900 }]) {
        await page.setViewportSize(size);
        await expect(previous).toBeVisible();
        await expect(next).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    await page.screenshot({ path: 'docs/ipados-validation/track-switch-split-view.png', fullPage: true });
});

test('native iPad keeps switches visible even when the primary pointer can hover', async ({ mount, page }) => {
    await page.addInitScript(() => {
        Object.assign(window, { CapacitorCustomPlatform: { name: 'ios' } });
        const original = window.matchMedia.bind(window);
        window.matchMedia = query => {
            const media = original(query);
            if (query === '(hover: hover) and (pointer: fine)') Object.defineProperty(media, 'matches', { value: true });
            return media;
        };
    });
    await mount('trackTitleNavigator');
    const next = page.getByRole('button', { name: 'Next track' });
    await expect(next).toBeVisible();
    await expect.poll(() => next.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.3);
    await next.tap();
    await expect(page.locator('[data-probe-track]')).toHaveAttribute('data-probe-track', 'Charlie Song');
    await page.mouse.move(10, 10);
    await expect(next).toBeVisible();
});
