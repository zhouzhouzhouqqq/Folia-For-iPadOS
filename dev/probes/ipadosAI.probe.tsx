import React from 'react';
import NativeAISettings from '../../src/components/modal/settings/NativeAISettings';
import type { ProbeDefinition } from './definition';

// Real AI settings editor. The browser harness supplies only a synthetic Capacitor bridge before module loading.
function AIProbe() { return <div className="mx-auto max-w-2xl p-4" style={{ color: '#eee', background: '#151820', minHeight: '100vh' }}><NativeAISettings /></div>; }
export default { id: 'ipadosAI', title: 'Personal AI settings', description: 'AI connection UI, test bridge only.', Component: AIProbe } satisfies ProbeDefinition;
