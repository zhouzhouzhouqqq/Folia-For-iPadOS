import React from 'react';
import TransitionSettingsSection from '../../src/components/modal/settings/TransitionSettingsSection';
import type { ProbeDefinition } from './definition';

// The original transition panel with only platform I/O substituted by a browser test harness.
function AutomixProbe() {
    return <div className="mx-auto max-w-2xl p-4" style={{ color: '#eee', background: '#151820', minHeight: '100vh' }}>
        <TransitionSettingsSection isDaylight={false} settingsCardClass="p-3" />
    </div>;
}
export default { id: 'ipadosAutomix', title: 'iPad AutoMix', description: 'Original transition panel and native models.', Component: AutomixProbe } satisfies ProbeDefinition;
