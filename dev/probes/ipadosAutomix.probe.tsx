import React from 'react';
import NativeAutomixModelsSection from '../../src/components/modal/settings/NativeAutomixModelsSection';
import type { ProbeDefinition } from './definition';

// The original transition panel with only platform I/O substituted by a browser test harness.
function AutomixProbe() {
    return <div className="mx-auto max-w-2xl p-4" style={{ color: '#eee', background: '#151820', minHeight: '100vh' }}>
        <NativeAutomixModelsSection />
    </div>;
}
export default { id: 'ipadosAutomix', title: 'iPad AutoMix', description: 'Original transition panel and native models.', Component: AutomixProbe } satisfies ProbeDefinition;
