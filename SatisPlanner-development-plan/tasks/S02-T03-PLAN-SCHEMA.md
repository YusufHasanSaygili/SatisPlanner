# S02-T03 — Plan Schema ve Migration Harness

**Amaç:** Uzun ömürlü, versioned ve atomik saklamaya uygun plan contract'ı kurmak.

**Çıktılar:** JSON schema; v1 fixture; parse/validate/serialize API; migration registry; unknown-field politikası; snapshot id bağı.

**Kabul:** Invalid plan alan bazlı hata verir; valid plan byte-stable canonical export üretebilir; future/unknown version güvenle reddedilir; migration fixture eklemek kolaydır.

**Test/Kanıt:** Schema validation, round-trip, malformed/future version cases.

**Bağımlılık:** S02-T01,T02. **Boyut:** M.
