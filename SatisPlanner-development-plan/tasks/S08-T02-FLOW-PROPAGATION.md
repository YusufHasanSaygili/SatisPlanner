# S08-T02 — Flow Propagation ve Split/Merge

**Amaç:** Typed graph boyunca supply, demand ve actual rate'i deterministik çözmek.

**Çıktılar:** dependency graph; topological solver; equal/manual/ratio splitter; merger conservation; per-port results.

**Kabul:** Material yaratılmaz/yok olmaz (amplification output dışında açık provenance); splitter toplam output input'u aşmaz; demand limitleri uygulanır; işlem sırası sonucu değiştirmez.

**Test/Kanıt:** Conservation property tests, randomized DAGs ve known chains.

**Bağımlılık:** S08-T01,S05. **Boyut:** XL.
