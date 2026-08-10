# S14-T02 — Release CI ve Supply Chain

**Amaç:** Tag'den doğrulanabilir release artifact üretmek.

**Çıktılar:** `SatisPlanner vX.Y.Z` GitHub Release workflow; SemVer/changelog; SHA-256; SBOM; third-party notices; signing decision; provenance metadata.

**Kabul:** Build clean runner'da; lockfile zorunlu; artifact checksum yayımlanır; tag, release ve pushed SHA birbiriyle eşleşir; signing yoksa açıkça unsigned; secrets least-privilege; license scan bloklayıcı policy'ye bağlı.

**Test/Kanıt:** Dry-run pre-release ve checksum verification.

**Bağımlılık:** S14-T01. **Boyut:** M.
