# Proje Uygulama Talimatları

Bu dosya, planı uygulayacak insan veya coding agent için bağlayıcı çalışma kurallarını tanımlar.

## Kapsam disiplini

- Ürünün resmi adı `SatisPlanner`'dır. Paket, uygulama, pencere başlığı, artifact, repository açıklaması ve release başlıklarında başka ürün adı kullanma.
- Yalnızca aktif slice'ın task'ları üzerinde çalış.
- Bir task dışı refactor gerekiyorsa önce ilgili slice dosyasına gerekçe ve acceptance kriteri ekle.
- Oyun verisini UI bileşenlerine hard-code etme. Her değer normalize edilmiş game-data snapshot'ından veya açıkça sürümlenmiş bir fallback tablosundan gelmeli.
- Satisfactory artwork'ünü veya kullanıcıdan alınan oyun dosyalarını repoya commit etme.
- Her üretim node'unu gerçek bir instance olarak sakla. Aynı recipe'yi kullanan iki makinenin ayarlarını tek aggregate değerde birleştirme.
- Material flow ve power formüllerini UI koduna koyma; saf, deterministik ve test edilebilir domain fonksiyonlarında tut.
- Save schema değişirse migration ve geriye dönük fixture testi olmadan merge etme.

## Zorunlu GitHub release ve kullanıcı onayı kuralı

> **HER BÜYÜK SLICE BİTTİĞİNDE COMMIT + PUSH + VERSION TAG + GITHUB RELEASE + CODEX ONAY BİLDİRİMİ ZORUNLUDUR.**

Bir slice'ın kapanış sırası değiştirilemez:

1. Slice kapsamındaki bütün task acceptance kriterlerini doğrula.
2. Slice dosyasında belirtilen unit/integration/E2E kontrollerini çalıştır.
3. Çalışma ağacında slice dışı değişiklik olmadığını kontrol et.
4. `docs(slice-XX): ...`, `feat(slice-XX): ...` veya `refactor(slice-XX): ...` biçiminde tek, anlamlı kapanış commit'i oluştur. Gerekli ara commit'ler olabilir; fakat slice kapanış commit'i şarttır.
5. Aktif branch'i remote'a push et.
6. Remote branch'in local `HEAD` commit SHA'sını içerdiğini doğrula.
7. Slice için [sürüm eşleme tablosundaki](14-VERSION-RELEASE-APPROVAL-WORKFLOW.md) annotated tag'i oluştur ve GitHub'a push et.
8. GitHub Release'i yayımla; v0.x sürümlerini pre-release, v1.0.0'ı stable olarak işaretle. Release notes; slice özeti, testler, closing SHA, artifact ve bilinen sorunları içersin.
9. Release/CI başarısını ve GitHub URL'sini doğrula.
10. Aynı Codex görevinde kullanıcıya şu formatta soru gönder: `SatisPlanner vX.Y.Z yayımlandı. Slice N/16 tamamlandı. Sonraki slice'a devam edilsin mi?`
11. Görevi `WAITING_FOR_USER_APPROVAL` durumunda durdur. Kullanıcı açıkça `evet`, `devam`, `onaylıyorum` veya eşdeğer onay vermeden sonraki slice'a ait hiçbir iş yapma.
12. Slice checklist'ini kapat; SHA, tag, GitHub Release, CI ve kullanıcı onayını Delivery Record'a kaydet.

**Push, tag, release veya CI başarısızsa bildirim gönderme ve sonraki slice'a geçme.** Bunların hepsi başarılı olsa bile kullanıcı onayı gelmeden devam etme.

Birden fazla büyük slice'ı tek commit, tek push veya tek release altında toplamak yasaktır. `--no-verify`, force-push, geçmişi yeniden yazma ve kırmızı CI ile devam etme varsayılan olarak yasaktır.

## Onay reddedilirse

- Sonraki slice başlamaz; mevcut slice yeniden açılır.
- İstenen düzeltmeler aynı slice kapsamında yapılır, test edilir ve yeniden push edilir.
- Aynı minor sürüm altında patch release çıkarılır (`v0.1.0` → `v0.1.1`).
- Codex güncel release bilgisiyle tekrar onay sorar ve yeniden bekler.

## Bildirim davranışı

- Codex soruyu aynı görevde sormalı; görev kullanıcı yanıtı bekleyen `Needs input`/`WAITING_FOR_USER_APPROVAL` durumunda kalmalıdır.
- Telefon/web/masaüstü push teslimi kullanıcının ChatGPT/Codex bildirim ayarlarına ve hesabında bulunan kanallara bağlıdır. Agent harici, doğrulanmamış bir push API'sine güvenemez.
- Question notifications kapalı görünüyorsa kullanıcıya `Settings > Notifications` içinden açması gerektiği bildirilir; fakat bu durum onay kapısını atlatmaz.

## Değişiklik güvenliği

- Upstream tabanı önce `upstream-d5c449a` benzeri immutable tag ile işaretle.
- Kontrollü yeniden yazım kararı kayda geçmeden eski C++ kaynaklarını silme.
- Silme gerekiyorsa önce parity raporu, save migration sonucu ve lisans/atıf kontrolü üret.
- Kullanıcı plan dosyaları, game-data snapshot'ları ve save dosyaları için atomik yazma + recovery tasarla.

## Kalite kapıları

- Typecheck, lint, formatting, unit ve integration testleri tüm slice'larda zorunludur.
- Graph veya kullanıcı akışı değişen slice'larda en az bir E2E senaryosu zorunludur.
- Hesap kuralı değişen slice'larda golden fixture ve property/invariant testi zorunludur.
- Importer değişen slice'larda en az iki locale fixture'ı ve bozuk/eksik dosya testi zorunludur.
- Release slice'ında temiz Windows makinesinde kurulum ve yerel Satisfactory data import smoke testi zorunludur.

## Veri ve hukuki sınırlar

- `CommunityResources/Docs` dosyalarının açık lisansla geldiği varsayılmaz; kaynağı ve checksum'u kayıt altına al, ham dosyayı release'e koyma.
- Coffee Stain'e ait icon/artwork release veya repo içine yeniden dağıtılmaz. Sadece kullanıcı kontrollü yerel cache kullanılır.
- Upstream MIT copyright ve izin metni, upstream kodunun önemli bölümleri kullanıldığı sürece korunur.
- Uygulama kendini resmi Coffee Stain ürünü gibi sunamaz.
