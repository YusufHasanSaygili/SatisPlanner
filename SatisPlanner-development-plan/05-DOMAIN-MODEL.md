# Domain Modeli

## Kimlik ve birimler

- Stable game entities: Unreal class id / class name
- Plan entities: UUID
- Material rate: exact rational + `items/min` veya `m³/min`
- Clock: 4 ondalık basamaklı decimal percent, `1.0000–250.0000`
- Power: decimal MW; karşılaştırmalar tanımlı toleransla
- Position: canvas-only `{x,y}` ve domain davranışından ayrı

## Plan kökü

```text
FactoryPlan
  schemaVersion
  planId, name, createdAt, updatedAt
  gameDataSnapshotId
  gameProfile
  nodes[]
  edges[]
  viewport
  userMetadata
```

## Node tipleri

- `ResourceNodeInstance`: resource id, purity, extractor config
- `MachineInstance`: building id, recipe id, clock, shard count, sloop count, standby
- `SplitterInstance`: strategy, per-output allocation/priority
- `MergerInstance`
- `Storage/Source/Sink`: boundary ve test amaçlı rate
- `Note/Group`: görsel organizasyon; material flow'a etkisiz

## Zorunlu MachineInstance invariant'ları

- Her instance'ın kendi id'si ve ayar objesi vardır; shared mutable configuration yasaktır.
- `powerShardCount ∈ {0,1,2,3}`.
- `maxClock = min(250, 100 + 50 × powerShardCount)`; underclock shard gerektirmez.
- Manuel clock girişi mevcut shard kapasitesini aşarsa command ya gerekli shard sayısını atomik olarak ayarlar ya da açık validation hatası üretir; sessiz geçersiz state yoktur.
- `somersloopCount` integer ve building'in snapshot'taki `somersloopSlots` değerini aşamaz.
- Recipe, building'in `producedIn` listesiyle uyumlu olmalıdır.
- Recipe değiştiğinde bağlantılar item/form uyumuna göre yeniden doğrulanır; veri kaybı kullanıcıya gösterilir.

## Edge modeli

```text
TransportEdge
  id, fromPortId, toPortId
  medium: conveyor | pipeline | virtual
  tierId
  capacity
  itemOrFluidId
  requestedRate, actualRate
  diagnostics[]
```

Capacity snapshot'tan/rule pack'ten türetilir; save içinde cache'lense bile yeniden hesaplanabilir alan olarak işaretlenir.

## Save uyumluluğu

- Her schema değişimi ileri yönlü migration fonksiyonuna sahiptir.
- Bilinmeyen fields mümkünse korunur.
- Import edilen upstream `.fcs` dosyasında aggregate CraftNode, açıkça seçilmiş stratejiyle bir veya daha çok MachineInstance'a genişletilir ve dönüşüm raporu üretilir.
