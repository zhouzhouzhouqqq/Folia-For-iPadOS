// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindIOSAudioContextLifecycle, configureIOSWebAudioSession, resumeIOSAudioContext } from '../../../src/platform/ios/audioSession';

// Exercise session policy and lifecycle recovery without substituting an audio graph or starting another player.
const platform = vi.hoisted(() => ({ native: true }));
vi.mock('../../../src/platform/capabilities', () => ({ isNativeIOS: () => platform.native }));
class Session extends EventTarget { type = 'auto'; state = 'active'; }
class Context extends EventTarget {
    state = 'suspended';
    resume = vi.fn(async () => { this.state = 'running'; });
}
let session: Session;
let context: Context;
let cleanup: (() => void) | undefined;
let requested: boolean;
const bind = () => { cleanup = bindIOSAudioContextLifecycle(context as unknown as AudioContext, () => requested); };
const visibility = (state: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
    document.dispatchEvent(new Event('visibilitychange'));
};
beforeEach(() => {
    platform.native = true; requested = true; session = new Session(); context = new Context();
    Object.defineProperty(navigator, 'audioSession', { configurable: true, value: session });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});
afterEach(() => { cleanup?.(); cleanup = undefined; vi.restoreAllMocks(); });
describe('iPad WebKit playback audio session', () => {
    it('selects playback and does not change an already selected session', () => {
        const setter = vi.fn();
        Object.defineProperty(session, 'type', { configurable: true, get: () => 'playback', set: setter });
        expect(configureIOSWebAudioSession()).toBe(true);
        expect(setter).not.toHaveBeenCalled();
        delete (session as Partial<Session>).type;
        session.type = 'auto';
        expect(configureIOSWebAudioSession()).toBe(true);
        expect(session.type).toBe('playback');
    });
    it('leaves desktop and browser sessions untouched', () => {
        platform.native = false;
        expect(configureIOSWebAudioSession()).toBe(false);
        bind(); visibility('visible');
        expect(session.type).toBe('auto');
        expect(context.resume).not.toHaveBeenCalled();
    });
    it('handles older or rejecting WebKit APIs without breaking foreground playback', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        Object.defineProperty(navigator, 'audioSession', { configurable: true, value: undefined });
        expect(configureIOSWebAudioSession()).toBe(false);
        Object.defineProperty(navigator, 'audioSession', { configurable: true, value: session });
        Object.defineProperty(session, 'type', { set: () => { throw new Error('not supported'); }, get: () => 'auto' });
        expect(configureIOSWebAudioSession()).toBe(false);
    });
    it('resumes only the existing context on return to the foreground', async () => {
        bind(); visibility('hidden');
        expect(context.resume).not.toHaveBeenCalled();
        visibility('visible'); await Promise.resolve();
        expect(context.resume).toHaveBeenCalledTimes(1);
        expect(session.type).toBe('playback');
    });
    it.each(['paused', 'closed', 'running', 'interrupted'] as const)('respects %s instead of forcing playback', reason => {
        if (reason === 'paused') requested = false;
        else if (reason === 'interrupted') session.state = 'interrupted';
        else context.state = reason;
        bind(); visibility('visible');
        expect(context.resume).not.toHaveBeenCalled();
    });
    it('waits for an interruption to end before resuming the same graph', async () => {
        session.state = 'interrupted'; context.state = 'interrupted'; bind();
        context.dispatchEvent(new Event('statechange'));
        expect(context.resume).not.toHaveBeenCalled();
        session.state = 'active'; session.dispatchEvent(new Event('statechange'));
        await Promise.resolve();
        expect(context.resume).toHaveBeenCalledTimes(1);
    });
    it('does not repeatedly resume a pending context and removes every listener on cleanup', async () => {
        let finish!: () => void;
        context.resume.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
        bind(); visibility('visible');
        window.dispatchEvent(new Event('pageshow')); session.dispatchEvent(new Event('statechange'));
        expect(context.resume).toHaveBeenCalledTimes(1);
        cleanup!(); requested = false; finish(); await Promise.resolve();
        context.resume.mockClear(); requested = true;
        visibility('visible'); window.dispatchEvent(new Event('pageshow'));
        context.dispatchEvent(new Event('statechange')); session.dispatchEvent(new Event('statechange'));
        expect(context.resume).not.toHaveBeenCalled();
    });
    it('deduplicates graph startup while WebKit resume waits for the media element to start', async () => {
        let finish!: () => void;
        context.resume.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
        resumeIOSAudioContext(context as unknown as AudioContext);
        resumeIOSAudioContext(context as unknown as AudioContext);
        expect(context.resume).toHaveBeenCalledTimes(1);
        finish(); await Promise.resolve(); await Promise.resolve();
        resumeIOSAudioContext(context as unknown as AudioContext);
        expect(context.resume).toHaveBeenCalledTimes(2);
        finish();
    });
});
