# S10-T02 — Schema Migrations ve Import/Export

**Amaç:** Plan formatını sürüm yükseltmelerinde korumak.

**Çıktılar:** migration registry; v1+ fixtures; export manifest; snapshot mismatch resolver; migration report.

**Kabul:** Her version yalnız bir sonraki version'a saf migrate eder; original dosya korunur; future version güvenle reddedilir; removed recipe unresolved node'a dönüşür; canonical export round-trip eşittir.

**Test/Kanıt:** All-version chain, unknown fields, mismatch/diff fixtures.

**Bağımlılık:** S10-T01,S02-T03,S03-T03. **Boyut:** L.
