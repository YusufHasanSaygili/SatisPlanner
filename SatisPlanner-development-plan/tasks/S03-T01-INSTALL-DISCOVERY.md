# S03-T01 — Install Discovery ve Source Probe

**Amaç:** Steam, Epic ve custom path üzerinden `CommunityResources/Docs` kaynağını read-only bulmak.

**Çıktılar:** platform discovery adapter; manual folder picker; canonical path validation; source probe sonucu ve user-facing errors.

**Kabul:** Oyun kurulu değilken app crash etmez; birden fazla kurulum kullanıcıya seçim sunar; source'a write yapılmaz; yalnız izin verilen path okunur.

**Test/Kanıt:** Steam/Epic/custom/missing/fake path integration fixtures.

**Bağımlılık:** Slice 01,02. **Boyut:** M.
