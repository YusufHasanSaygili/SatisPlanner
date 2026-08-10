# S11-T02 — Multiplier Integration

**Amaç:** Doğrulanmış 1.2 recipe/power multiplier semantiğini calculation engine'e eklemek.

**Çıktılar:** profile-aware formula decorators; result provenance; profile-change invalidation; UI summary.

**Kabul:** Power multiplier sonuçta açık çarpan; recipe cost hangi inputs/outputs'a uygulanıyorsa fixture ile kanıtlı; multiplier iki kez uygulanmaz; save/reload profile'ı korur.

**Test/Kanıt:** Default ve tüm supported multiplier golden matrix; profile switch E2E.

**Bağımlılık:** S11-T01,S08. **Boyut:** M.
