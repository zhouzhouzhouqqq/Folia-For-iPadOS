# Mobile protocol sources

Generated offline from the versions already locked by Folia. No Node runtime, local HTTP server or external login relay is included.

- `qq.js`: `@yakult-green-tea/qq-music-api` 3.3.1, MIT. Includes the host-neutral QR service, Android protocol crypto/bootstrap, MQTT 5 codec, credential lifecycle and route operations. Logger replaced with a silent implementation to prevent account payload logging. HTTP, repository and socket implementations are injected by Folia. Original comments retained.
- `kugou.js`: `kugoumusicapi` 1.6.0, MIT. Includes only the current Folia adapter's endpoint constructors and portable crypto/signing helpers. Node HTTP, Express, OAuth server credentials, proxy and runtime fingerprint collection are excluded. Public client app identifiers and request signature constants are part of the protocol; they are not developer/server credentials. Device registration uses the upstream synthetic profile, never actual iPad telemetry.
- The KuGou browser bundle also contains crypto-js, node-forge, pako, big-integer, buffer, base64-js and ieee754. License files are in `licenses/`, with original license comments retained in the bundle.

Regenerate using `node dev/ipados/vendor-mobile-providers.mjs` after a deliberate review of upstream changes. The bundles are committed source artifacts so self-builds require no generator run. Folia's AGPL obligations remain in effect. Neither Tencent nor KuGou endorses this project.
