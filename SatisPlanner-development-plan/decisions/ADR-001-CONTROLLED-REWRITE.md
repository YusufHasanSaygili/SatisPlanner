# ADR-001 — Kontrollü Yeniden Yazım

- Durum: Önerildi; Slice 00 kanıtından sonra kabul/reddedilecek
- Tarih: 2026-08-10

## Bağlam

Upstream küçük ve aktif bir C++/ImGui uygulamasıdır; exact rate, graph propagation ve save migrations gibi değerli parçaları vardır. Yeni kapsam ise fiziksel machine instance'ları, modern inspector UX, native local import, kapasite taşıyan edges ve kapsamlı otomatik test ister. Mevcut `production_app.cpp` büyük ölçüde UI, persistence ve propagation sorumluluklarını birleştirir.

## Karar

Varsayılan yön, upstream geçmişini/tag'ini koruyarak yeni uygulamayı Tauri 2 + React/TypeScript üzerinde kontrollü yeniden yazmaktır. Domain/calculation UI'dan bağımsız paketler olur. Eski kod, P0 parity ve migration kanıtı alınmadan silinmez.

## Sonuçlar

- Modern graph/inspector geliştirme ve E2E testi kolaylaşır.
- Yerel filesystem import Rust sınırında tutulur.
- C++ davranışlarını yeniden uygulama maliyeti doğar.
- `.fcs` uyumluluğu ayrı importer gerektirir.

## Kabul kanıtı

- Upstream baseline build ve iki characterization senaryosu
- 200-node React Flow + calculation spike performansı
- Local Docs discovery/import spike
- Save migration fizibilite raporu

Kanıt eşiği aşılmazsa C++ çekirdeğini refactor edip yeni UI katmanı geliştirme alternatifi yeniden değerlendirilir.
