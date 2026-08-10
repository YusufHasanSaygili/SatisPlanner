# S02-T02 — Machine Instance Invariant'ları

**Amaç:** Geçersiz clock/shard/sloop/recipe state'ini construction aşamasında engellemek.

**Çıktılar:** `MachineInstance`, extractor config, typed ports ve domain commands; stable UUID factory; validation error catalog.

**Kabul:** shard 0→max 100%, 1→150%, 2→200%, 3→250%; clock 1–250 ve 4 decimal; sloop building slotunu aşamaz; iki instance state paylaşmaz.

**Test/Kanıt:** Full boundary matrix ve instance isolation property test.

**Bağımlılık:** S02-T01. **Boyut:** L.
