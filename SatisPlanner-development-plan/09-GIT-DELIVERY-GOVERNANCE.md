# GitHub, Release, Bildirim ve Slice Teslim Yönetimi

## Değiştirilemez kural

Her büyük slice ayrı acceptance gate, kapanış commit'i, verified GitHub push'u, SemVer tag'i, GitHub Release'i ve kullanıcı onayıyla tamamlanır. Release yayımlansa bile kullanıcı açık onay vermeden sonraki slice başlamaz.

## Branch modeli

- `main`: daima release edilebilir; `v0.x` kararsızlık durumu SemVer ve release notes ile açıkça belirtilir
- `slice/XX-short-name`: tek büyük slice kapsamı
- Task commit'leri slice branch'inde olabilir
- Slice kapanışı PR veya doğrudan yetkili merge politikasıyla `main`e gelir

## Commit örnekleri

- `chore(slice-01): establish workspace and quality gates`
- `feat(slice-07): add independent machine instance controls`
- `feat(slice-09): enforce belt and pipeline capacities`
- `test(slice-13): lock 1.2 calculation golden fixtures`

## Slice kapanış checklist'i

- [ ] Bütün task dosyaları Done
- [ ] Acceptance kriterleri kanıtlandı
- [ ] İlgili testler yeşil
- [ ] Docs/ADR/schema güncel
- [ ] Lisans ve generated asset kontrolü geçti
- [ ] Slice dışı değişiklik yok
- [ ] Kapanış commit'i oluşturuldu
- [ ] Remote push başarılı
- [ ] Remote SHA = beklenen local SHA
- [ ] CI başarılı
- [ ] Slice sürüm tag'i push edildi
- [ ] GitHub Release yayımlandı ve URL doğrulandı
- [ ] Codex onay sorusu gönderildi
- [ ] Görev `WAITING_FOR_USER_APPROVAL` durumunda durdu
- [ ] Kullanıcının açık onayı kaydedildi
- [ ] SHA, release ve onay kanıtları kaydedildi

## Push/release başarısızlığı

- Sorunu çöz; commit'i kaybetme veya başka slice'a taşıma.
- Network/permission blokajı varsa slice `Blocked: release verification` kalır.
- Local çalışma tamamlanmış olsa bile slice Done sayılmaz.

## Release sonrası zorunlu bekleme

Codex, release URL'si ve CI sonucuyla birlikte `SatisPlanner vX.Y.Z yayımlandı. Slice N/16 tamamlandı. Sonraki slice'a devam edilsin mi?` sorusunu aynı görevde gönderir. Kullanıcı `evet/devam/onaylıyorum` benzeri açık onay verene kadar dosya değişikliği, yeni branch, araştırma veya sonraki-slice planlaması yapılamaz.

Kullanıcı düzeltme isterse mevcut slice yeniden açılır ve patch release yayımlanır. Yeni milestone sürümüne geçilmez.

## Yasaklar

- Birden fazla büyük slice'ı tek dev commit, tag veya release'te toplamak
- Testleri atlamak için `--no-verify`
- Kullanıcı açıkça istemedikçe force-push veya history rewrite
- Kırmızı CI ile sonraki slice'a geçmek
- Game icon cache, ham Docs dump veya kullanıcı save'ini commit etmek

## Kanıt kaydı

Her slice dosyasının sonundaki “Delivery Record” alanına branch, closing SHA, remote SHA, tag, GitHub Release URL, CI run, bildirim tarihi, kullanıcı onay mesajı ve tarih girilir. Bu alan planlama aşamasında boş bırakılır; uygulama sırasında doldurulur.
