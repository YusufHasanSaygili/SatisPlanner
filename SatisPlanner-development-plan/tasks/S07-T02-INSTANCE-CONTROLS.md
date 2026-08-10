# S07-T02 — Per-Instance Clock/Shard/Sloop Controls

**Amaç:** Her makine için bağımsız ve oyuna uygun ayar UX'i sağlamak.

**Çıktılar:** shard buttons; 4-decimal clock input; sloop count buttons; actual multiplier labels; inline validation/fix actions.

**Kabul:** Constructor 0/1→1×/2×; Assembler 0/1/2→1×/1.5×/2×; Manufacturer 0..4→1×..2×; 0-slot building'de sloop control disabled/açıklamalı; clock-shard state atomik.

**Test/Kanıt:** Slot/multiplier UI matrix, boundary E2E, accessibility labels.

**Bağımlılık:** S07-T01,S02-T02. **Boyut:** L.
