import { FoliaMusicProviders, type MobileMusicProvider } from '../../../platform/ios/musicProviders';

// Serial, snapshot-based Keychain writes. A failed save is retried and surfaced before claiming login success.
export async function loadSecureState(provider: MobileMusicProvider) {
    const { value } = await FoliaMusicProviders.loadState({ provider });
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid secure provider state');
    const state: Record<string, any> = parsed;
    let tail = Promise.resolve();
    let pending: string | undefined;
    let failure: unknown;
    const save = () => {
        const snapshot = JSON.stringify(state);
        pending = snapshot;
        tail = tail.then(async () => {
            try {
                await FoliaMusicProviders.saveState({ provider, value: snapshot });
                if (pending === snapshot) { pending = undefined; failure = undefined; }
            } catch (error) { failure = error; }
        });
    };
    const flush = async () => {
        await tail;
        if (pending && failure) {
            save();
            await tail;
            if (failure) throw new Error('无法保存安全登录会话，请解锁设备后重试');
        }
    };
    return { state, save, flush };
}
