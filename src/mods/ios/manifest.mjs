import foliumShared from '../../../electron/modSystem/foliumShared.json' with { type: 'json' };

// Portable mirror of the pure desktop manifest validators in electron/modSystem/manifest.cjs.
// No Node APIs. Keep validation/range behavior aligned when updating the upstream host.
const FOLIUM_VERSION = Object.freeze({ ...foliumShared.version });

// Folium 1 permission set. Anything else is rejected at validation time so a
// mod can never claim a capability the loader does not implement (fail closed).
// Permissions are a declaration shown in the trust dialog, not a sandbox.
const KNOWN_PERMISSIONS = new Set(Object.keys(foliumShared.permissions));

// Unfrozen surfaces a mod must opt into explicitly; they may change in any minor.
const KNOWN_EXPERIMENTAL = new Set(Object.values(foliumShared.experimental));

/*
 * Manifest fields that belonged to the pre-Folium draft. They are rejected with
 * a pointed message instead of being ignored, so an old mod fails loudly rather
 * than loading half-configured.
 */
const REMOVED_FIELDS = {
    apiVersion: 'apiVersion-replaced-by-folium: declare "folium": 1 instead of "apiVersion"',
    entry: 'entry-replaced-by-main: the Node entry is now "main" (and the renderer entry "client")',
    visualizers: 'visualizers-moved-to-client: register visualizers from the client entry (folium.registries.visualizers)',
};

const MOD_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

// Deterministic result envelope shared by all validators.
const ok = (value) => ({ ok: true, value });
const fail = (errors) => ({ ok: false, errors });

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/*
 * Dependency strings in `depends` are either a bare mod id ("base-mod") or
 * "id@^1.2.3". Only the caret range and the wildcard are supported in apiVersion 1;
 * unsupported operators are reported as validation errors instead of being guessed.
 */
const parseDependency = (raw) => {
    if (typeof raw !== 'string' || raw.trim().length === 0) {
        return { ok: false, error: `invalid dependency entry ${JSON.stringify(raw)}` };
    }
    const at = raw.lastIndexOf('@');
    if (at <= 0) {
        return { ok: true, id: raw.trim(), range: null };
    }
    const id = raw.slice(0, at).trim();
    const range = raw.slice(at + 1).trim();
    if (!MOD_ID_PATTERN.test(id)) {
        return { ok: false, error: `invalid dependency id in "${raw}"` };
    }
    if (range !== '*' && !/^\^[0-9]+\.[0-9]+\.[0-9]+$/.test(range)) {
        return { ok: false, error: `unsupported version range "${range}" in "${raw}"` };
    }
    return { ok: true, id, range };
};

const parseVersion = (version) => {
    const match = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(String(version ?? '').trim());
    if (!match) {
        return null;
    }
    return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
};

const compareVersions = (left, right) => {
    if (left.major !== right.major) return left.major - right.major;
    if (left.minor !== right.minor) return left.minor - right.minor;
    return left.patch - right.patch;
};

const satisfiesRange = (version, range) => {
    if (!range || range === '*') {
        return true;
    }
    const parsed = parseVersion(version);
    if (!parsed) {
        return false;
    }
    if (range.startsWith('^')) {
        const min = parseVersion(range.slice(1));
        if (!min) {
            return false;
        }
        if (compareVersions(parsed, min) < 0) {
            return false;
        }
        // Caret range: same major version.
        return parsed.major === min.major;
    }
    return false;
};

/*
 * Host version ranges (`"folia"`): space-separated comparators that must all
 * hold, e.g. ">=0.7.0 <0.8.0". Supported operators: >=, >, <=, <, =, ^ and a
 * bare version (exact). "*" matches everything. Anything else is invalid.
 */
const HOST_COMPARATOR_PATTERN = /^(>=|>|<=|<|=|\^)?([0-9]+\.[0-9]+\.[0-9]+)$/;

const parseHostRange = (range) => {
    if (typeof range !== 'string' || range.trim().length === 0) {
        return null;
    }
    const trimmed = range.trim();
    if (trimmed === '*') {
        return [];
    }
    const comparators = [];
    for (const token of trimmed.split(/\s+/)) {
        const match = HOST_COMPARATOR_PATTERN.exec(token);
        if (!match) {
            return null;
        }
        comparators.push({ operator: match[1] ?? '=', version: parseVersion(match[2]) });
    }
    return comparators;
};

const satisfiesHostRange = (version, range) => {
    const comparators = parseHostRange(range);
    const parsed = parseVersion(version);
    if (!comparators || !parsed) {
        return false;
    }
    return comparators.every(({ operator, version: bound }) => {
        const order = compareVersions(parsed, bound);
        switch (operator) {
            case '>=': return order >= 0;
            case '>': return order > 0;
            case '<=': return order <= 0;
            case '<': return order < 0;
            case '^': return order >= 0 && parsed.major === bound.major;
            default: return order === 0;
        }
    });
};

// A relative path inside the mod directory: no traversal, no backslashes, no absolute paths.
const isSafeRelativePath = (value) => (
    isNonEmptyString(value)
    && !value.includes('..')
    && !value.includes('\\')
    && !value.startsWith('/')
    && !/^[a-zA-Z]:/.test(value)
);

/*
 * `embedOrigins` entries must be bare https origins ("https://host[:port]"),
 * exactly what `new URL(x).origin` returns, so the runtime check can compare
 * strings instead of re-parsing patterns.
 */
const isHttpsOrigin = (value) => {
    if (typeof value !== 'string') return false;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.origin === value;
    } catch {
        return false;
    }
};

const validateManifest = (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return fail(['manifest root must be a JSON object']);
    }

    const errors = [];
    Object.entries(REMOVED_FIELDS).forEach(([field, message]) => {
        if (raw[field] !== undefined) {
            errors.push(message);
        }
    });

    const manifest = {
        folium: raw.folium,
        id: raw.id,
        name: raw.name,
        version: raw.version,
        author: raw.author ?? null,
        description: raw.description ?? null,
        main: raw.main ?? null,
        client: raw.client ?? null,
        depends: Array.isArray(raw.depends) ? raw.depends : [],
        permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
        experimental: Array.isArray(raw.experimental) ? raw.experimental : [],
        embedOrigins: Array.isArray(raw.embedOrigins) ? raw.embedOrigins : [],
        folia: raw.folia ?? null,
        preview: raw.preview ?? null,
    };

    if (manifest.folium !== FOLIUM_VERSION.major) {
        errors.push(`unsupported folium version ${JSON.stringify(manifest.folium)}; this host implements folium ${FOLIUM_VERSION.major}`);
    }
    if (!isNonEmptyString(manifest.id) || !MOD_ID_PATTERN.test(manifest.id)) {
        errors.push('mod.id is required and must match /^[a-z0-9][a-z0-9-]*$/');
    }
    if (!isNonEmptyString(manifest.name)) {
        errors.push('mod.name is required');
    }
    if (typeof manifest.name === 'string' && manifest.name.length > 64) {
        errors.push('mod.name is limited to 64 characters');
    }
    if (!parseVersion(manifest.version)) {
        errors.push('mod.version must be a semantic version like 1.2.3');
    }
    if (manifest.main === null && manifest.client === null) {
        errors.push('a mod needs at least one entry: "main" (Node) or "client" (renderer)');
    }
    if (manifest.main !== null && (!isNonEmptyString(manifest.main) || /[\\/]/.test(manifest.main) || !/\.c?js$/.test(manifest.main))) {
        errors.push('mod.main must be a single .cjs/.js file name inside the mod directory');
    }
    if (manifest.client !== null && (!isSafeRelativePath(manifest.client) || !/\.m?js$/.test(manifest.client))) {
        errors.push('mod.client must be a relative .mjs/.js path inside the mod directory');
    }
    // Introduction image (shown by the mod market): optional here, required there.
    if (manifest.preview !== null && (!isSafeRelativePath(manifest.preview) || !/\.(png|jpe?g|webp)$/i.test(manifest.preview))) {
        errors.push('mod.preview must be a relative .png/.jpg/.webp path inside the mod directory');
    }

    const dependencyIds = new Set();
    manifest.depends.forEach((dependency) => {
        const parsed = parseDependency(dependency);
        if (!parsed.ok) {
            errors.push(parsed.error);
            return;
        }
        if (dependencyIds.has(parsed.id)) {
            errors.push(`duplicate dependency "${parsed.id}"`);
        }
        dependencyIds.add(parsed.id);
    });

    const permissionIds = new Set();
    manifest.permissions.forEach((permission) => {
        if (typeof permission !== 'string' || !KNOWN_PERMISSIONS.has(permission)) {
            errors.push(`unknown or unsupported permission ${String(permission)}`);
            return;
        }
        if (permissionIds.has(permission)) {
            errors.push(`duplicate permission "${permission}"`);
        }
        permissionIds.add(permission);
    });

    manifest.experimental.forEach((feature) => {
        if (typeof feature !== 'string' || !KNOWN_EXPERIMENTAL.has(feature)) {
            errors.push(`unknown experimental feature ${String(feature)}`);
        }
    });

    manifest.embedOrigins.forEach((origin) => {
        if (!isHttpsOrigin(origin)) {
            errors.push(`embedOrigins entry ${JSON.stringify(origin)} must be a bare https origin like "https://example.com"`);
        }
    });
    if (manifest.embedOrigins.length > 0 && !permissionIds.has('net.embed')) {
        errors.push('embedOrigins requires the net.embed permission');
    }

    if (manifest.folia !== null && !parseHostRange(manifest.folia)) {
        errors.push(`mod.folia ${JSON.stringify(manifest.folia)} is not a supported version range (e.g. ">=0.7.0 <0.8.0")`);
    }

    return errors.length > 0 ? fail(errors) : ok(manifest);
};


export { validateManifest, parseDependency, satisfiesRange, satisfiesHostRange };
