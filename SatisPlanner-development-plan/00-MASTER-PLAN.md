# SatisPlanner Ana Geliştirme Planı

## Sonuç hedefi

**SatisPlanner** adıyla masaüstünde çalışan, offline-first, drag-and-drop graph tabanlı bir Satisfactory 1.2 fabrika planlayıcısı. Kullanıcı bir resource node ekleyip saflık ve miner tier seçer; conveyor/pipeline tier'larıyla üretim makinelerine bağlar; her makineyi bağımsız clock, Power Shard ve Somersloop ayarıyla yapılandırır; uygulama gerçek throughput, power ve bottleneck sonuçlarını anlık gösterir.

## Strateji

- Upstream repo kaynak, davranış, format ve lisans referansı olarak korunur.
- Slice 00'da build/behavior baseline alınır ve kontrollü yeniden yazım ADR'si onaylanır.
- Domain/calculation çekirdeği UI ve Tauri'den bağımsız geliştirilir.
- Kurulu oyun verisi normalize edilmiş, immutable ve checksum'lı snapshot'a dönüştürülür.
- UI graph state ile simulation state ayrılır; hesaplar deterministik worker/service katmanında yürür.
- Eski `.fcs` dosyaları için best-effort importer geliştirilir; dönüştürülemeyen alanlar kullanıcıya raporlanır.

## Slice sırası

| Milestone | Teknik slice | Yayımlanan sürüm | Sonuç | Boyut | Bağımlılık |
|---:|---:|---|---|---:|---|
| 1/16 | 00 | v0.1.0 | Upstream baseline ve rewrite karar kapısı | M | — |
| 2/16 | 01 | v0.2.0 | Repo/CI/uygulama iskeleti | M | 00 |
| 3/16 | 02 | v0.3.0 | Domain, units ve save schema | L | 01 |
| 4/16 | 03 | v0.4.0 | Satisfactory 1.2 Docs importer | L | 02 |
| 5/16 | 04 | v0.5.0 | Yerel icon resolver/cache | M | 03 |
| 6/16 | 05 | v0.6.0 | Graph canvas ve inspector iskeleti | L | 02 |
| 7/16 | 06 | v0.7.0 | Resource node + extractor/miner modellemesi | L | 03,05 |
| 8/16 | 07 | v0.8.0 | Bağımsız production machine instance'ları | L | 03,05 |
| 9/16 | 08 | v0.9.0 | Material flow + power hesap motoru | XL | 06,07 |
| 10/16 | 09 | v0.10.0 | Belt/pipe kapasitesi ve bottleneck | L | 08 |
| 11/16 | 10 | v0.11.0 | Save/autosave/upstream migration | L | 02,05,08 |
| 12/16 | 11 | v0.12.0 | 1.2 game-mode profilleri ve localization | M | 03,08 |
| 13/16 | 12 | v0.13.0 | Undo/redo, auto-layout, accessibility ve UX polish | L | 05–11 |
| 14/16 | 13 | v0.14.0 | Test sertleştirme ve performans | L | 03–12 |
| 15/16 | 14 | v0.15.0 | Desktop packaging ve release pipeline | M | 13 |
| 16/16 | 15 | v1.0.0 | Belgeler, örnek fabrikalar ve final kabul | M | 14 |

Her satır ayrı GitHub Release'tir. Release sonrası Codex kullanıcıya telefon/web/masaüstü bildirim ayarları üzerinden ulaşabilen bir onay sorusu gönderir ve açık onay gelene kadar durur. Ayrıntı: [Release ve Onay Akışı](14-VERSION-RELEASE-APPROVAL-WORKFLOW.md).

## MVP kabul senaryosu

1. Kullanıcı library'den Coal Resource Node sürükler.
2. Purity = Pure, Miner = Mk.3, Power Shards = 3, Clock = 250% seçer.
3. Uygulama 1200 Coal/min üretim gösterir.
4. Mk.5 belt bağlanırsa edge kırmızı olur: kapasite 780/min, kayıp 420/min.
5. Belt Mk.6 seçildiğinde kapasite uyarısı kapanır.
6. İki farklı Constructor instance'ı eklenir. Birincisi 100%/0 shard/0 sloop; ikincisi 200%/2 shard/1 sloop olarak kaydedilir.
7. Her instance'ın input, output ve power sonucu ayrı hesaplanır; birini değiştirmek diğerini etkilemez.
8. Save kapatılıp açıldığında bütün ayarlar, graph viewport'u ve game-data snapshot kimliği korunur.

## Release dışı bırakılanlar

- Dünya haritasındaki gerçek node koordinatlarının veya 1.2 random seed sonucunun yeniden üretilmesi
- Boru head-lift, slug-flow ve transient fluid simülasyonu
- Train/vehicle rota süre simülasyonu
- Multiplayer collaboration/cloud sync
- Tam otomatik global optimum fabrika solver'ı
- Oyun .pak dosyalarının lisans incelemesi yapılmadan otomatik dağıtılabilir extractor ile açılması

Bu maddeler extension point olarak tasarlanır; MVP teslimini bloke etmez.
