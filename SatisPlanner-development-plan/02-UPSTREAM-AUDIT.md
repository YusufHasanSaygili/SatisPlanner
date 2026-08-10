# Upstream Kod İncelemesi

## İncelenen referans

- Repo: `adepierre/ficsit-companion`
- Commit: `d5c449adebe335cf326b6cb2d49c106888fc06c8`
- Commit tarihi: 14 Haziran 2026
- Lisans: MIT
- Yerel inceleme: yaklaşık 7.554 satır vendor dışı C++ header/source; `production_app.cpp` tek başına yaklaşık 3.920 satır

## Korunmaya değer parçalar

- Node/pin/link tabanlı çalışan graph davranışı
- Exact fractional material-rate fikri
- Splitter/merger/group davranışları ve propagation yaklaşımı
- `.fcs` save versioning ve v1→v7 migration geçmişi
- Desktop + Emscripten build bilgisi ve çoklu OS CI niyeti
- Satisfactory recipe/building/item normalization için mevcut extractor'ın alan eşlemeleri
- Upstream credit, MIT metni ve ürünün resmi olmayan fan tool olduğu disclaimer

## Mevcut veri durumu

README “1.0 data” dese de HEAD'deki `assets/satisfactory.json` kendini `1.2` olarak işaretliyor ve yaklaşık 15 building, 152 item, 293 recipe içeriyor. Bu çelişki, version label'a tek başına güvenilmemesi ve import provenance/checksum zorunluluğu için somut örnektir.

## Gereksinimlerle boşluklar

| Alan | Upstream durumu | Hedef boşluk |
|---|---|---|
| Machine modeli | Craft node rate'i gerektiğinde çoklu makine sayısına genişliyor | Her fiziksel makine ayrı instance olmalı |
| Power Shard | Ayrı shard count alanı yok | `0–3` count ve clock invariant'ı |
| Clock | `current_rate` üretim katsayısı gibi kullanılıyor | Kullanıcının gerçek clock yüzdesi ayrı değer |
| Somersloop | Craft node'a özel count var | Doğru slot sayısı, instance bağımsızlığı ve UI düğmeleri |
| Resources | Recipe graph odaklı | Purity + miner/extractor tier node'ları |
| Logistics | Link eşitliği/uyuşmazlığı var | Belt/pipe tier, kapasite ve kayıp throughput |
| Importer | Legacy `Docs.json`, manuel FModel icon klasörü varsayımı | 1.2 localized Docs discovery, provenance, güvenli cache |
| Testing | Build CI var; otomatik test upstream TODO'su | Unit/property/integration/E2E/visual test piramidi |
| Modülerlik | UI, persistence, propagation büyük `production_app.cpp` içinde | Domain, data, calculation, graph ve platform ayrımı |
| Asset dağıtımı | Oyun ikonları repoda mevcut | Yeni release'te kullanıcı-yerel import, fallback asset |

## Karar önerisi

**Kontrollü yeniden yazım** önerilir. Upstream doğrudan silinmez:

1. Commit tag'lenir ve baseline artifact üretilir.
2. Save formatı ve kritik graph davranışları characterization testleriyle belgelenir.
3. Yeni stack ayrı dizinde ayağa kaldırılır.
4. P0 parity ve `.fcs` migration raporu alındıktan sonra eski runtime'ın kaldırılması ayrı bir karar/commit olur.

Bu yaklaşım, upstream'in iyi fikirlerini taşırken aggregate node modelini yeni ürünün temeline kilitlemez.
