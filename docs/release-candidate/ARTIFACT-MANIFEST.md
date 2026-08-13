# SatisPlanner v1.0.0 Artifact Manifest

| Asset | Purpose |
| --- | --- |
| `SatisPlanner-windows-x64-v1.0.0-setup.exe` | Current-user NSIS installer |
| `SatisPlanner-windows-x64-portable-v1.0.0.zip` | Portable Windows executable, license and notices |
| `SatisPlanner-linux-x64-portable-v1.0.0.zip` | Portable Linux executable, license and notices |
| `SatisPlanner-macos-portable-v1.0.0.zip` | Portable macOS executable, license and notices |
| `SatisPlanner-web-v1.0.0.zip` | Static offline web build |
| `SatisPlanner-examples-v1.0.0.zip` | Three fallback-only canonical example plans and README |
| `SatisPlanner-documentation-v1.0.0.zip` | User guide, UAT, limitations, credits and rollback documents |
| `SatisPlanner-sbom.spdx.json` | Exact SPDX JSON software bill of materials |
| `SHA256SUMS.txt` | SHA-256 manifest for every release subject |
| `THIRD-PARTY-NOTICES.md` | Primary dependency notices and game-asset disclaimer |
| `CHANGELOG.md` | Version history and stable release summary |

The verified release workflow downloads the published assets again and checks the manifest before
success. GitHub/Sigstore provenance and SBOM attestations cover every SHA-256 subject in the manifest.
