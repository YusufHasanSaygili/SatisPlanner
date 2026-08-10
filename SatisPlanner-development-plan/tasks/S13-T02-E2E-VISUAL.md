# S13-T02 — E2E, Visual ve Recovery Suite

**Amaç:** Kullanıcı akışlarını packaged davranışa yakın otomatik doğrulamak.

**Çıktılar:** Ana Coal scenario; üç bağımsız machine; save/reopen; import failure/fallback; migration; keyboard; visual snapshots.

**Kabul:** Testler stable ids/accessibility selectors kullanır; pixel diff platform politikası var; flaky retry kök nedeni gizlemez; failure artifact screenshot/trace/save içerir.

**Test/Kanıt:** Chromium + packaged smoke E2E ve visual report.

**Bağımlılık:** S13-T01,Slice 12. **Boyut:** L.
