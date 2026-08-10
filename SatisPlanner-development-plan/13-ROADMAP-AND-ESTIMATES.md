# Roadmap ve Tahminleme

## Tahmin yaklaşımı

Takvim sözü yerine T-shirt size kullanılır. Tek geliştirici/agent için yaklaşık göreli efor:

- S: 0.5–1 odaklı gün
- M: 2–4 gün
- L: 4–8 gün
- XL: 8–15 gün

Araştırma belirsizliği bulunan task'lar timebox spike ile başlar; spike bitmeden kesin takvim verilmez.

## Fazlar

### Faz A — Temel ve kanıt (Slice 00–04)

Upstream kararı, repo iskeleti, domain contracts, 1.2 importer ve legal-safe icon pipeline. En büyük belirsizlik Docs/icon alanlarıdır.

### Faz B — Dikey çalışan ürün (Slice 05–09)

Graph, resource extraction, bağımsız machine instance'ları, calculation ve logistics. Slice 09 sonunda MVP'nin ana Coal acceptance senaryosu çalışır.

### Faz C — Dayanıklılık ve tam ürün (Slice 10–13)

Save/migration, 1.2 profilleri, UX polish, kapsamlı test ve performans.

### Faz D — Dağıtım (Slice 14–15)

Installer, release pipeline, docs, örnek planlar ve RC kabulü.

## Kritik yol

`00 → 01 → 02 → 03 → (05 + 06 + 07) → 08 → 09 → 10 → 13 → 14 → 15`

Oklar yalnız teknik bağımlılığı gösterir. Operasyonel olarak her okun arasında `commit → push → tag → GitHub Release → Codex bildirimi → kullanıcı onayı` kapısı vardır. Açık onay gelmeden kritik yol ilerlemez.

Icon pipeline (04), 1.2 profiles (11) ve UX polish (12) kısmen paralel geliştirilebilir; ancak bu planın Git kuralı gereği büyük slice teslimleri birbirine karıştırılmaz.

## Scope kontrolü

Bir talep P0 kabul senaryosunu ilerletmiyorsa P1/P2 backlog'a alınır. World-map seed simülasyonu, transient fluids ve cloud collaboration MVP'yi bloke edemez.
