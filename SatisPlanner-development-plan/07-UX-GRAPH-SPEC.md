# Graph ve UX Spesifikasyonu

## Ana yerleşim

- Sol: searchable Satisfactory Library
- Orta: sonsuz canvas, minimap, zoom, selection ve connection tools
- Sağ: seçili instance inspector
- Alt/overlay: diagnostics ve actual-vs-required özeti

## Library kategorileri

- Resources
- Extractors
- Production
- Logistics
- Power/Generators
- Organization (splitter, merger, group, note)

Item, building ve recipe adları aktif Docs locale'ından gelir. Search class id, localized name ve alias ile çalışır.

## Instance inspector

Machine seçildiğinde:

- Instance adı/id
- Building + recipe
- Clock numeric input ve slider
- Power Shard `0/1/2/3` hızlı düğmeleri
- Somersloop `0..slotCount` hızlı düğmeleri; her düğmede o makinenin gerçek output multiplier'ı
- Base / clock-adjusted / amplified input-output
- Actual supplied, actual produced, efficiency
- Power MW
- Inline validation ve tek tık düzeltme önerileri

Başka bir instance seçildiğinde state tamamen o instance'tan okunur. Global machine-type clock/sloop ayarı yoktur.

## Resource inspector

- Resource türü ve icon
- Impure / Normal / Pure
- Miner/Extractor tier
- Clock + shard
- Teorik output ve bağlı edge sonrası taşınabilen output

## Edge inspector

- Medium ve tier
- Capacity
- Requested / actual / lost
- Taşınan item/fluid
- Bottleneck nedeni

Kapasite aşımı kırmızı, sınırda çalışma amber, sağlıklı akış yeşil/neutral ile gösterilir; renk tek gösterge değildir, icon ve metin de bulunur.

## Etkileşimler

- Library'den sürükle-bırak
- Porttan porta connect; hover sırasında uyumluluk önizlemesi
- Multi-select, duplicate, delete, group, copy/paste
- Undo/redo command history
- Keyboard navigation ve screen-reader label'ları
- Auto-layout kullanıcı isteğiyle; manuel pozisyonları izinsiz bozmaz

## Error UX

- Geçersiz bağlantı oluşturulmadan önce açıklanır.
- Game-data snapshot değişiminde kırılan recipe/node'lar “unresolved” olarak korunur; sessiz silinmez.
- Import başarısızsa app açılır ve fallback catalog ile neyin eksik olduğunu gösterir.
