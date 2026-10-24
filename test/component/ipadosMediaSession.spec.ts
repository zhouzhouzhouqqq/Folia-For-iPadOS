import { expect, test } from './fixtures';

// Capture installed callbacks while preserving the real WebKit API. Invoking them is not a physical OS remote event.
test('WebKit owns metadata, cover, seek and one previous/next callback across real media changes', async ({ mount, page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
        const testWindow = window as typeof window & { __mediaActions: Record<string, MediaSessionActionHandler | null>; __nativeCalls: string[];
            __musicControls: { next: boolean; previous: boolean }[] };
        Object.assign(window, { CapacitorCustomPlatform: { name: 'ios' } });
        testWindow.__mediaActions = {}; testWindow.__nativeCalls = []; testWindow.__musicControls = [];
        const original = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
        navigator.mediaSession.setActionHandler = (action, callback) => {
            testWindow.__mediaActions[action] = callback; original(action, callback);
        };
        Object.assign(window, { Capacitor: {
            PluginHeaders: [{ name: 'FoliaDevice', methods: ['configureAudio', 'setMusicControls', 'publishNowPlaying', 'prepareMediaArtwork', 'addListener', 'removeListener'].map(name => ({ name, rtype: 'promise' })) }],
            nativePromise: async (_plugin: string, method: string, payload: { next: boolean; previous: boolean; data?: string }) => {
                testWindow.__nativeCalls.push(method);
                if (method === 'setMusicControls') { testWindow.__musicControls.push(payload); return { ...payload, skipForward: false, skipBackward: false }; }
                // Synthetic cover only; ImageIO itself is exercised by dev/ipados/artwork/main.swift.
                if (method === 'prepareMediaArtwork') return { data: payload.data };
                return {};
            },
            nativeCallback: () => 'synthetic-listener',
        } });
    });
    await mount('ipadosMediaSession');
    await page.getByRole('button', { name: 'Start synthetic playback' }).click();
    const state = () => page.evaluate(() => ({ title: navigator.mediaSession.metadata?.title, artist: navigator.mediaSession.metadata?.artist,
        cover: navigator.mediaSession.metadata?.artwork[0]?.src.split(',')[0], playing: navigator.mediaSession.playbackState,
        paused: document.querySelector('audio')?.paused }));
    await expect.poll(state).toEqual({ title: 'Synthetic A', artist: 'Synthetic Artist', cover: 'data:image/jpeg;base64', playing: 'playing', paused: false });
    const musicPolicy = () => page.evaluate(() => {
        const probe = window as unknown as { __mediaActions: Record<string, MediaSessionActionHandler | null>; __musicControls: { next: boolean; previous: boolean }[] };
        return { hasNext: !!probe.__mediaActions.nexttrack, hasPrevious: !!probe.__mediaActions.previoustrack,
            hasSkipForward: !!probe.__mediaActions.seekforward, hasSkipBackward: !!probe.__mediaActions.seekbackward,
            canSeekTo: !!probe.__mediaActions.seekto, native: probe.__musicControls.at(-1) };
    });
    const expectedPolicy = { hasNext: true, hasPrevious: true, hasSkipForward: false, hasSkipBackward: false,
        canSeekTo: true, native: { next: true, previous: true } };
    const waitForAudio = async () => expect.poll(() => page.locator('audio').evaluate(element => {
        const audio = element as HTMLAudioElement;
        return !audio.paused && audio.readyState >= 3 && audio.currentSrc === audio.src;
    })).toBe(true);
    await expect.poll(musicPolicy).toEqual(expectedPolicy);
    for (let index = 0; index < 6; index++) {
        await command('nexttrack');
        await expect.poll(async () => (await state()).title).toBe('Synthetic B');
        await waitForAudio();
        await command('previoustrack');
        await expect.poll(async () => (await state()).title).toBe('Synthetic A');
        await waitForAudio();
    }
    expect(await page.locator('audio').count()).toBe(1);
    async function command(action: MediaSessionAction, seekTime?: number) {
        await page.evaluate(({ action, seekTime }) => {
            const actions = (window as unknown as { __mediaActions: Record<string, MediaSessionActionHandler> }).__mediaActions;
            // A real OS media action has user activation. A plain evaluate callback does not.
            const trigger = document.createElement('button'); trigger.id = 'test-media-action'; trigger.textContent = 'Dispatch media action';
            trigger.onclick = () => { actions[action]({ action, seekTime }); trigger.remove(); };
            document.body.append(trigger);
        }, { action, seekTime });
        await page.locator('#test-media-action').click();
    }
    await command('nexttrack');
    await expect.poll(async () => (await state()).title).toBe('Synthetic B');
    await expect(page.locator('[data-media-probe]')).toHaveAttribute('data-media-probe', '1');
    await expect.poll(async () => (await state()).paused).toBe(false);
    await expect.poll(musicPolicy).toEqual(expectedPolicy);
    await command('previoustrack');
    await expect.poll(async () => (await state()).title).toBe('Synthetic A').catch(async error => {
        console.log('Synthetic media diagnostics:', await page.evaluate(() => {
            const audio = document.querySelector('audio')!;
            return { ready: audio.readyState, duration: audio.duration, time: audio.currentTime, paused: audio.paused,
                ended: audio.ended, error: audio.error?.code, sourceMatches: audio.currentSrc === audio.src,
                sourceLength: audio.currentSrc.length, attrLength: audio.src.length, ui: document.querySelector('output')?.textContent,
                playbackError: document.querySelector('output')?.getAttribute('data-error') };
        }));
        throw error;
    });
    await command('seekto', 5);
    await expect.poll(() => page.locator('audio').evaluate(a => (a as HTMLAudioElement).currentTime)).toBeGreaterThanOrEqual(5);
    await command('pause');
    await expect.poll(async () => (await state()).playing).toBe('paused');
    await command('play');
    await expect.poll(async () => (await state()).playing).toBe('playing');
    await expect.poll(musicPolicy).toEqual(expectedPolicy);
    expect(await page.evaluate(() => (window as unknown as { __nativeCalls: string[] }).__nativeCalls)).not.toContain('publishNowPlaying');
    await expect(page.locator('[data-error]')).toHaveAttribute('data-error', '');
});
