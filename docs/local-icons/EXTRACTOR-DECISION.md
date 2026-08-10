# Optional Asset Extractor Decision Gate

Decision date: 2026-08-10
Target release: `v0.5.0`
Decision: **NO-GO for an automatic bundled extractor**

## Outcome

SatisPlanner does not ship, download or automatically execute a `.pak`, IoStore
or cooked-asset extraction tool. Users may select a folder they have already
extracted and converted to PNG, JPEG or WebP. The source remains read-only;
SatisPlanner creates only resized WebP files in its app-owned cache.

This is a product/security decision, not a claim that local extraction is
always unlawful. An extractor's software license does not grant redistribution
rights for Coffee Stain Studios artwork.

## Evaluated toolchain options

| Candidate | Pinned evidence | License | Useful capability | Blocking gap for v0.5.0 |
| --- | --- | --- | --- | --- |
| Epic `UnrealPak` / engine Pak APIs | [Official packaging documentation](https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-projects?application_version=4.27) | Unreal Engine terms | Canonical Pak implementation | Engine distribution/terms, version coupling; encrypted indexes require keys |
| `repak` | [`355b5f6`](https://github.com/trumank/repak/tree/355b5f62f51959c7cc6dd5a51708646ef483065d) | Apache-2.0 | Pak list/get/unpack, explicit traversal guard | Does not by itself convert cooked textures; AES/compression/version support remains game-dependent |
| UE Viewer | [`a0bfb46`](https://github.com/gildor2/UEViewer/tree/a0bfb468d42be831b126632fd8a0ae6b3614f981) | MIT | Package viewing and texture export | Project documentation advertises UE1–4 coverage; native parser/decoder and Satisfactory patch compatibility are unproven |
| UAssetGUI/UAssetAPI | [`1338f79`](https://github.com/atenfyr/UAssetGUI/tree/1338f79defb0db5a0b98918780f59686400e4cf1) | MIT | Low-level cooked asset examination | Not a single-purpose, sandboxed image export pipeline; mappings/version compatibility add maintenance surface |

Epic's documentation states that encrypted Pak indexes prevent opening or
unpacking without the appropriate key. It also documents Pak signing and full
asset encryption. A generic local extractor therefore cannot be treated as a
stable, always-safe capability.

## Threat model

| Threat | Impact | Required mitigation before reconsideration |
| --- | --- | --- |
| Malformed archive exploits native parser/decoder | Code execution or crash | Sandboxed child process, memory/CPU/time limits, maintained parser and fuzz evidence |
| Archive path traversal or symlink escape | Writes outside app cache | Canonical allowlist, no direct unpack-to-disk, per-entry output confinement |
| Encrypted/compressed/patch-specific container | Silent corruption or failed imports | Supported-build matrix, fail-loud diagnostics, no embedded/discovered keys |
| Extract-all behavior | Excess disk usage and unnecessary artwork copies | Exact asset allowlist, byte/file-count budget and cancellation |
| Downloaded sidecar substitution | Supply-chain compromise | Pinned version, source revision, per-platform SHA-256/signature and reproducible provenance |
| Implicit extraction | Unexpected handling of proprietary content | Separate explicit consent showing source, destination, scope and clear action |
| Cache cleanup bug | User data deletion | App-owned canonical root plus manifest-only deletion; never recursive source deletion |
| Release packaging mistake | Artwork redistribution | CI artifact scan and release archive inspection |

## Reopen criteria

All items are mandatory:

1. Written legal/product review covering local extraction and tool distribution.
2. One minimal adapter with a pinned source revision and checksummed binaries.
3. Read-only, exact-asset PoC against supported Satisfactory builds.
4. Sandboxed execution with byte/file/time limits and traversal tests.
5. Explicit, revocable user consent; no background or first-run extraction.
6. CI verification proving no extracted artwork enters source or release assets.

Until then, the manual extracted-folder workflow is not a degraded fallback; it
is the supported local-icon workflow.
