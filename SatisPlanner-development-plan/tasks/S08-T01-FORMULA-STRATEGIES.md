# S08-T01 — Machine/Extractor Formula Stratejileri

**Amaç:** Rate ve power hesaplarını building türüne göre saf, sürümlenebilir stratejilere ayırmak.

**Çıktılar:** production machine, extractor, generator ve variable-power interfaces; result provenance; formula registry.

**Kabul:** Input yalnız clock ile, output clock×amplification ile; production power exponent 1.321928; sloop power `(1+filled/total)^2`; unsupported formula explicit error.

**Test/Kanıt:** Constructor/Assembler/Manufacturer/Refinery/Miner golden fixtures ve power toleransı.

**Bağımlılık:** Slice 03,06,07. **Boyut:** L.
