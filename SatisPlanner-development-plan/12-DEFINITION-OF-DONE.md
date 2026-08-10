# Definition of Done

## Task Done

- Task kapsamı dışında gizli değişiklik yok.
- Deliverable tamamlandı.
- Acceptance kriterlerinin her biri kanıtlandı.
- Task türüne uygun test yazıldı ve geçti.
- Public contract/schema değiştiyse docs güncellendi.
- Yeni risk veya karar ADR/risk kaydına işlendi.

## Slice Done

- Slice içindeki tüm task'lar Done.
- Slice-level E2E/fixture kabulü geçti.
- CI yeşil.
- Generated/untracked oyun asset'i yok.
- Kapanış commit'i oluşturuldu.
- Remote push ve SHA eşliği doğrulandı.
- Eşleme tablosundaki version tag push edildi.
- GitHub Release başarıyla yayımlandı ve CI/artifact doğrulandı.
- Codex aynı görevde devam onayı sorusunu gönderdi.
- Kullanıcının açık onayı Delivery Record'a kaydedildi.
- Delivery Record dolduruldu.
- Sonraki slice bağımlılıkları güncellendi.

## MVP Done

- Ana plandaki Coal → Mk.6 → iki bağımsız Constructor kabul senaryosu çalışıyor.
- Satisfactory 1.2 Docs importu gerçek kurulumda doğrulandı.
- Fallback catalog ile uygulama oyun kurulu değilken açılıyor.
- Save/autosave/recovery ve schema migration geçiyor.
- 500-node performans bütçesi ve accessibility smoke geçiyor.
- Windows installer temiz makinede kuruluyor/kaldırılıyor.
- Lisans, credits, disclaimer ve third-party notices dahil.
- Bütün büyük slice'ların ayrı closing commit/push kanıtı var.
- Bütün büyük slice'ların ayrı GitHub Release'i ve kullanıcı onay kaydı var.

## Release Done

- SemVer sürümü ve changelog
- Signed veya açıkça unsigned olarak etiketlenmiş artifact
- SHA-256 checksum
- CI'dan yeniden üretilebilir build
- Known limitations
- Game data snapshot/importer compatibility bilgisi
- Rollback ve issue template bilgisi
