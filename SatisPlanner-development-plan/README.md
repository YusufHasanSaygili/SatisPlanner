# SatisPlanner — Satisfactory 1.2 Factory Planner Geliştirme Planı

Bu paket yalnızca planlama ve uygulama talimatları içerir; uygulama kodu içermez. Ürünün değiştirilemez adı **SatisPlanner**'dır. Hedef, `adepierre/ficsit-companion` projesini kaynak ve davranış referansı olarak kullanıp Satisfactory 1.2 için gerçek makine instance'larını modelleyen profesyonel bir fabrika tasarım editörü geliştirmektir.

## Değiştirilemez ürün ilkeleri

1. Her üretim makinesi instance'ı kendi `recipe`, `clockPercent`, `powerShardCount`, `somersloopCount`, çalışma durumu ve bağlantılarına sahip olur.
2. Resource node saflığı, extractor/miner tier'ı, conveyor/pipeline tier'ı ve taşıma kapasitesi graph modelinin gerçek parçalarıdır.
3. Uygulama steady-state material flow hesaplar; kapasite aşımını, eksik beslemeyi ve geçersiz item/fluid bağlantılarını görünür bottleneck olarak raporlar.
4. Oyun verisinin birincil kaynağı, kullanıcının kurulu Satisfactory 1.2 kopyasındaki `CommunityResources/Docs/<locale>.json` dosyalarıdır.
5. Oyun ikonları release içine gömülmez. Kullanıcının kendi kurulumundan veya kendi çıkardığı asset klasöründen yerel cache'e alınır; fallback ikonlar her zaman bulunur.
6. Upstream MIT lisansı ve atıf korunur. Yeniden yazım, upstream geçmişini ve kaynak kredisini silmek anlamına gelmez.
7. **Her büyük slice; acceptance kriterleri ve testleri geçtikten sonra ayrı commit edilir, GitHub'a push edilir, sürüm tag'i ve GitHub Release olarak yayımlanır.**
8. Release başarıyla yayımlandıktan sonra Codex aynı görevde kullanıcıya bildirim üreten açık bir onay sorusu gönderir: **“SatisPlanner vX.Y.Z yayımlandı. Sonraki slice'a devam edilsin mi?”**
9. **Kullanıcı açıkça onay vermeden sonraki slice'ın araştırması, planlaması veya kodlaması başlayamaz.** Görev `WAITING_FOR_USER_APPROVAL` durumunda bekler.

## Önerilen uygulama yönü

Plan, kontrollü yeniden yazımı önerir: Tauri 2 masaüstü kabuğu, React + TypeScript kullanıcı arayüzü, `@xyflow/react` graph canvas'ı, platformdan bağımsız saf domain/calculation paketleri ve yalnızca yerel dosya/oyun keşfi için dar kapsamlı Rust komutları. Nihai karar Slice 00'ın kanıt kapısında verilir; karar kaydı olmadan eski kod silinmez.

## Okuma sırası

1. [Ana Plan](00-MASTER-PLAN.md)
2. [Proje Talimatları](AGENTS.md)
3. [Ürün Kapsamı](01-PRODUCT-SCOPE.md)
4. [Upstream İncelemesi](02-UPSTREAM-AUDIT.md)
5. [Hedef Mimari](03-TARGET-ARCHITECTURE.md)
6. [Oyun Verisi ve Import](04-GAME-DATA-IMPORT.md)
7. [Domain Modeli](05-DOMAIN-MODEL.md)
8. [Hesap Kuralları](06-CALCULATION-RULES.md)
9. [Graph UX](07-UX-GRAPH-SPEC.md)
10. [Test Stratejisi](08-TEST-STRATEGY.md)
11. [Git Teslim Kuralı](09-GIT-DELIVERY-GOVERNANCE.md)
12. [Riskler ve Lisans](10-RISKS-LICENSING.md)
13. [İzlenebilirlik](11-TRACEABILITY.md)
14. [Definition of Done](12-DEFINITION-OF-DONE.md)
15. [Roadmap](13-ROADMAP-AND-ESTIMATES.md)
16. [Sürüm, Release, Bildirim ve Onay Akışı](14-VERSION-RELEASE-APPROVAL-WORKFLOW.md)
17. `slices/` ve `tasks/`

Araştırma 10 Ağustos 2026 tarihinde yapılmıştır. Kaynaklar [SOURCES.md](references/SOURCES.md) dosyasındadır.
