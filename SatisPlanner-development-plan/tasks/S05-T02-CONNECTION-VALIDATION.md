# S05-T02 — Typed Connection Validation

**Amaç:** Kullanıcı bağlantıyı bırakmadan port uyumluluğunu açıklamak ve geçersiz graph'ı engellemek.

**Çıktılar:** port type rules; hover preview; connect domain command; diagnostic messages; edge projection.

**Kabul:** Output→input yönü zorunlu; item id/form uyumsuzluğu reddedilir; solid→pipeline ve fluid→conveyor reddedilir; duplicate/illegal self edge engellenir; hata metni erişilebilirdir.

**Test/Kanıt:** Valid/invalid connection matrix ve E2E hover/deny.

**Bağımlılık:** S05-T01,S02. **Boyut:** M.
