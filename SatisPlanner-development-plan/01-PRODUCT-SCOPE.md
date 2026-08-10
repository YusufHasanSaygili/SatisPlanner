# Ürün Kapsamı

Ürünün resmi ve değiştirilemez adı **SatisPlanner**'dır.

## Kullanıcı problemi

Mevcut production calculator'lar çoğunlukla “kaç makine gerekir?” sonucunu aggregate eder. Hedef ürün, oyuncunun oyunda gerçekten kuracağı fiziksel hattı instance instance çizmesini ve her ekipmanın gerçek ayarlarıyla doğrulamasını sağlar.

## Temel personelar

- **Planner:** Yeni fabrikanın akışını oyuna girmeden kurar.
- **Builder:** Oyunda kurduğu gerçek makineleri bire bir işaretler ve darboğaz arar.
- **Optimizer:** Clock, sloop, shard ve tier alternatiflerini power/throughput açısından karşılaştırır.

## P0 özellikleri

- Searchable library ve canvas'a sürükle-bırak
- Resource node: resource type, Impure/Normal/Pure, extractor/miner type ve tier
- Production machine: building, recipe, clock `1.0000–250.0000%`, `0–3` Power Shard, makineye göre `0–1/2/4` Somersloop
- Katı ve fluid portlarını ayıran typed connections
- Conveyor Mk.1–Mk.6 ve Pipeline Mk.1–Mk.2 kapasitesi
- Splitter, merger ve manuel/eşit dağıtım
- Actual/required/surplus/deficit/efficiency
- Geçersiz recipe-item bağlantısı ve bottleneck uyarıları
- Power tüketimi ve production amplification
- Save, autosave, recovery, import/export
- Kurulu oyundan localized Docs import ve yerel icon cache

## P1 özellikleri

- Auto-layout, groups, colors, notes, minimap, keyboard-first actions
- 1.2 power/recipe cost multiplier profilleri
- Upstream `.fcs` importer
- PNG/SVG/PDF plan export'u
- Web read-only viewer veya data importu olmayan web editor

## Non-functional hedefler

- 500 node / 800 edge graph'ta etkileşimli pan/zoom hedefi
- Kullanıcı girdisinden sonra görünür hesap güncellemesi hedefi: p95 < 100 ms (normal graph)
- Import sonuçları deterministic: aynı kaynak + aynı importer sürümü = aynı snapshot hash'i
- Çökme veya elektrik kesintisinde son güvenli autosave'in geri alınabilmesi
- En az Türkçe ve İngilizce uygulama arayüzü; oyun item adları seçilen Docs locale'ından
- Windows öncelikli; mimari macOS/Linux yolunu kapatmaz

## Başarı ölçütleri

- MVP kabul senaryosunun tamamen otomatik E2E testi
- Resmi 1.2 kural fixture'larının tamamında beklenen oranlar
- İki aynı building/recipe instance'ının farklı clock/shard/sloop değerlerini bağımsız saklama testi
- Kaynak veri eksikken anlaşılır hata ve fallback ikonlarla kullanılabilir çalışma
- Her slice'ın ayrı verified push, version tag, GitHub Release ve açık kullanıcı onayı ile izlenebilir olması
