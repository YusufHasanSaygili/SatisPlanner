# Hesap Motoru Kuralları

## Üretim makinesi

`clockFactor = clockPercent / 100`

- Input rate = base input rate × `clockFactor`
- Amplification = `1 + somersloopCount / somersloopSlots` (slot yoksa `1`)
- Output rate = base output rate × `clockFactor` × amplification
- Power amplification multiplier = `(1 + somersloopCount / somersloopSlots)^2`
- Production power = base power × `clockFactor^1.321928` × power amplification multiplier

Variable-power binalar için Docs'tan gelen recipe/building alanları ayrı stratejiyle işlenir ve golden fixture gerekir.

## Somersloop gerçek slot davranışı

| Slot | Makine örnekleri | Seçilebilir çarpanlar |
|---:|---|---|
| 1 | Smelter, Constructor | 1×, 2× |
| 2 | Assembler, Foundry, Refinery, Converter | 1×, 1.5×, 2× |
| 4 | Manufacturer, Blender, Particle Accelerator, Quantum Encoder | 1×, 1.25×, 1.5×, 1.75×, 2× |
| 0 | Miner, extractors, Packager vb. | yalnız 1× |

Bu tablo UI'ya hard-code edilmez; snapshot/rule pack'teki `somersloopSlots` üzerinden türetilir.

## Clock ve Power Shard

- Clock aralığı `1.0000–250.0000%`.
- Her shard maksimum clock'a +50 puan ekler; 3 shard ile 250%.
- Üretim oranı clock ile lineer, production building power tüketimi `1.321928` üssüyle non-lineer değişir.
- Generator/extractor türleri, kendi rule strategy'sine sahiptir; production-machine formülü körlemesine uygulanmaz.

## Resource extraction

- Purity: Impure `0.5×`, Normal `1×`, Pure `2×`.
- Normal-node 100% baseline: Miner Mk.1 `60/min`, Mk.2 `120/min`, Mk.3 `240/min`.
- Örnek: Pure + Miner Mk.3 + 250% = `240 × 2 × 2.5 = 1200/min`.
- Oil, water ve resource well extractor'ları ayrı descriptor/strategy olarak ele alınır.

## Logistics kapasitesi

- Conveyor Mk.1–Mk.6: `60, 120, 270, 480, 780, 1200 items/min`.
- Pipeline Mk.1–Mk.2: `300, 600 m³/min`.
- `actualRate = min(suppliedRate, demandedRate, edgeCapacity)`; kayıp/eksik nedenleri ayrı diagnostic olur.
- Average steady-state rate temel sonuçtur. Somersloop cycle burst etkisi için P1 “burst risk” uyarısı eklenebilir.

## Graph çözümü

- Portlar item id + form (solid/liquid/gas) ile tiplenir.
- Directed acyclic altgraph tek geçişle çözülür.
- Recycle/byproduct loop için strongly connected component tespiti ve kontrollü iterasyon/fixed-point gerekir.
- Splitter allocation açık stratejidir: equal, manual rate, ratio veya priority. Belirsiz durumda sessiz tahmin yapılmaz.
- Her sonuç `value + provenance + diagnostics` döndürür.

## Yuvarlama

- Material flow iç hesapları exact rational tutulur.
- UI görüntüsü yapılandırılabilir ondalıkla yuvarlar; save exact değeri korur.
- Power ve üs hesaplarında yüksek hassasiyetli decimal/f64 kullanılır; test toleransı açıkça belgelenir.
