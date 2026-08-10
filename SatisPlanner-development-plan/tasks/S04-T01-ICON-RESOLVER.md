# S04-T01 — Icon Resolver Contract ve Fallback

**Amaç:** Catalog icon asset path'lerini dağıtımsız, güvenli UI resource'larına çözmek.

**Çıktılar:** resolver interface; category fallback seti; class-id/asset-path mapping; missing-icon diagnostic.

**Kabul:** Hiç oyun asset'i yokken bütün node'lar tanınabilir fallback gösterir; resolver UI framework'ünden bağımsız; arbitrary URL/path render edilmez; cache miss sessiz kırık image oluşturmaz.

**Test/Kanıt:** Missing/unknown/duplicate mapping unit tests ve visual snapshot.

**Bağımlılık:** Slice 03. **Boyut:** S.
