# Satisfactory 1.2 Game Data ve Icon Import Mimarisi

## Birincil veri kaynağı

Satisfactory 1.2, kurulum altındaki `CommunityResources/Docs` klasöründe locale bazlı UTF-16 JSON dump'ları sunar. Varsayılan örnek yollar:

- Steam: `.../steamapps/common/Satisfactory/CommunityResources/Docs`
- Epic: `.../SatisfactoryEarlyAccess/CommunityResources/Docs`

Legacy tekil `Docs.json` yalnız adapter/fallback olarak desteklenir. Yeni importer önce `en-US.json`, `tr.json` gibi locale dosyalarını arar.

## Pipeline

1. **Discover:** Steam/Epic olası yolları ve kullanıcının seçtiği özel yolu bul.
2. **Probe:** Dosya encoding'i, boyutu, okunabilirliği ve beklenen class gruplarını kontrol et.
3. **Parse:** UTF-16/UTF-8 güvenli parse; ham kaynağı değiştirme.
4. **Normalize:** Stable class id, display name, form, recipe inputs/outputs, duration, produced-in, building power ve shard/amplification alanları.
5. **Enrich:** Docs'ta güvenilir olmayan/olmayan miner, purity, logistics tier ve 1.2 game-mode kurallarını versioned rule pack ile birleştir.
6. **Validate:** Duplicate class id, missing reference, negatif süre, bilinmeyen form ve slot çelişkilerini raporla.
7. **Snapshot:** `gameVersion`, `buildId` (bulunabiliyorsa), `locale`, importer version, source hash ve normalized hash ile immutable catalog üret.
8. **Activate:** Kullanıcı onayından sonra planın aktif snapshot'ını değiştir; mevcut plan için diff/migration raporu göster.

## Icon stratejisi

- Docs descriptor içindeki icon asset path'i yalnız bir resolver anahtarıdır; PNG dosyası değildir.
- Release içine Satisfactory iconları konmaz.
- Adapter önceliği:
  1. Kullanıcının daha önce çıkardığı asset klasörü
  2. Onaylı ve yerel çalışan optional extractor adapter'ı (ayrı hukuk/güvenlik gate'i)
  3. App'in kendi özgün generic category ikonları
- Cache kullanıcı data dizinindedir; manifestte `sourcePath`, source hash, resolver version ve normalized icon name bulunur.
- Cache temizliği yalnız app-owned klasörde ve manifest allowlist'iyle yapılır.

## Veri güvenliği

- Import read-only yapılır; oyun kurulumuna yazılmaz.
- Tauri filesystem izinleri yalnız seçilen Docs/asset path'leri ve app data diziniyle scope edilir.
- Ham Docs veya icon cache telemetry/cloud'a gönderilmez.
- Parse error kullanıcıya dosya, alan ve düzeltme önerisiyle gösterilir; sessiz fallback yapılmaz.

## 1.2 özel not

Docs dump kapsamlıdır fakat dünya node koordinatları, collectibles ve bazı runtime kuralları içermez. Bu nedenle source-of-truth katmanları açıkça ayrılır: `docs-derived`, `versioned-rule-pack`, `user-plan` ve ileride `save-derived`.
