# Paket Manifesti

Bu artifact yalnız Markdown planlama dosyalarından oluşur; uygulama kaynak kodu, Satisfactory Docs dump'ı veya oyun artwork'ü içermez.

## İçerik özeti

- 1 başlangıç README'si
- 1 bağlayıcı `AGENTS.md` proje talimatı
- 15 ana ürün/mimari/veri/hesap/test/yönetim belgesi (`00`–`14`)
- 5 Architecture Decision Record
- 16 büyük slice planı
- 48 ayrı uygulanabilir task planı
- 2 araştırma/kaynak belgesi
- Bu manifest

Toplam: **89 Markdown dosyası**.

## Klasörler

- `/decisions`: Teknoloji, source-of-truth, precision, instance ve asset kararları
- `/slices`: Büyük teslim dilimleri; her biri zorunlu commit+push kapısı ve Delivery Record içerir
- `/tasks`: Her slice için üç ayrı task; amaç, çıktılar, acceptance, test, bağımlılık ve boyut
- `/references`: Kaynak bağlantıları ve araştırma bulguları

## Başlangıç

Önce [README](README.md), sonra [Ana Plan](00-MASTER-PLAN.md), [Proje Talimatları](AGENTS.md) ve [Release/Onay Akışı](14-VERSION-RELEASE-APPROVAL-WORKFLOW.md) okunmalıdır. Uygulama Slice 00'dan başlar; release sonrası kullanıcı onayı kuralı atlanamaz.
