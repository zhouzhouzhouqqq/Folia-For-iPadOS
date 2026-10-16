import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Reproducible host-Swift tests for the iOS-independent AI configuration/transport; no real Keychain or network.
const root = resolve(import.meta.dirname, '../../..');
const work = resolve(root, '../../work/ai-validation');
mkdirSync(work, { recursive: true });
const binary = resolve(work, 'core-tests');
execFileSync('xcrun', ['swiftc', '-swift-version', '5', 'ios/App/App/AI/AIConfiguration.swift',
    'ios/App/App/AI/AIService.swift', 'dev/ipados/ai/CoreTests.swift', '-o', binary], { cwd: root, stdio: 'inherit' });
execFileSync(binary, [], { cwd: root, stdio: 'inherit' });
