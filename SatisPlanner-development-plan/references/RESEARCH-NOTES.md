# Araştırma Notları

## Tarih düzeltmesi

Satisfactory 1.2 stable sürümü 2 Haziran 2026'da yayımlandı. 24 Haziran 2026 tarihi 1.2.3.1 patch'ine aittir; ana 1.2 release tarihi değildir.

## Upstream bulguları

- Audited HEAD: `d5c449a`, 14 Haziran 2026.
- Repo C++17, Dear ImGui, ImGui Node Editor, SDL/OpenGL ve Emscripten kullanıyor.
- CI Windows/Linux/macOS desktop ve web build alıyor.
- README otomatik testleri gelecek fikir olarak listeliyor; repoda test suite bulunmadı.
- Save formatında `save_version` ve migration kodu mevcut; mevcut sabit v7.
- HEAD asset'i `version: 1.2` diyor. README updating bölümü hâlâ 1.0 dediği için provenance uyuşmazlığı var.
- Extractor tekil UTF-16 `Docs.json` ve önceden FModel ile çıkarılmış icon klasörü bekliyor.
- CraftNode `current_rate` üzerinden gerekli makine sayısını aggregate ediyor; ayrı `powerShardCount` yok.
- CraftNode'da `num_somersloop` instance/node alanı var, fakat hedef fiziksel makine instance modelinin tamamını karşılamıyor.

## 1.2 doğrulanan kurallar

- Stable 1.2: 2 Haziran 2026; incelenen sonraki patch: 1.2.3.1, 24 Haziran 2026.
- Clock: 1–250%, dört ondalık hassasiyet; shard başına +50 maksimum clock, en fazla 3.
- Purity: 0.5×/1×/2×.
- Miner normal baseline: 60/120/240 per minute.
- Belt: 60/120/270/480/780/1200 items/min.
- Pipe: 300/600 m³/min.
- Somersloop slot boost, toplam slot sayısına bağlıdır; bütün makinelerde sabit +25% değildir.
- Amplified power: `(1 + filled/total)^2`; clock power exponent yaklaşık 1.321928.
- 1.2 Game Modes resource node purity/randomization, recipe parts cost ve power consumption multipliers ekler.

## Bilinçli belirsizlikler

- Docs dosyaları açık lisansla gelmez.
- Iconların otomatik .pak extraction ile alınmasının dağıtım/güvenlik yöntemi ayrıca onaylanmalıdır.
- 1.2 recipe parts cost multiplier'ın her recipe alanına tam uygulama semantiği oyun içi fixture ile kanıtlanmalıdır.
- World randomization seed çözümü Docs'ta bulunmaz ve MVP dışıdır.

## SatisPlanner teslimat kararı

- Ürünün değiştirilemez adı `SatisPlanner` olarak belirlendi.
- On altı büyük kilometre taşı `v0.1.0` ile başlayıp `v1.0.0` ile biter; her biri ayrı GitHub Release'tir.
- Her Release doğrulandıktan sonra Codex aynı task içinde devam onayı sorar ve açık kullanıcı onayı gelene kadar sonraki slice'a başlamaz.
- Codex soru/izin bildirimleri ve Activity içindeki bekleyen yanıt durumu kullanılabilir; telefona ulaşan kanal kullanıcının hesap ve bildirim ayarlarına bağlıdır.
- Kullanıcı düzeltme isterse aynı slice yeniden açılır, düzeltme patch sürümü olarak yayımlanır ve onay yeniden istenir.
