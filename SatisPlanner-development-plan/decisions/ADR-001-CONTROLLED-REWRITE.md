# ADR-001 — Kontrollü Yeniden Yazım

- Durum: Kabul edildi
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

- Upstream desktop build/runtime smoke geçti.
- Basit craft chain, Somersloop ve splitter/merger characterization testleri
  geçti; v7 save round-trip golden fixture ile byte/semantic eşitliği sağlandı.
- 200 node / 199 edge React Flow spike'ında tek-node güncellemesi 10,8 ms; 20
  pan/zoom frame'i toplam 111,1 ms ölçüldü.
- Typed domain command 200 instance içinde yalnız hedef instance'ı immutable
  biçimde güncelledi; Vitest 2/2 geçti.
- Tauri dialog + Rust read-only JSON probe derlendi; Rust testi 1/1 geçti,
  release executable üretildi ve runtime smoke geçti.
- Ayrıntılı kanıt: `docs/baseline/REWRITE-SPIKE-REPORT.md`.

Kanıt eşiği aşılmazsa C++ çekirdeğini refactor edip yeni UI katmanı geliştirme alternatifi yeniden değerlendirilir.
