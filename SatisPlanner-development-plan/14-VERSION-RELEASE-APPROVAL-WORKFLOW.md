# SatisPlanner Sürüm, GitHub Release, Bildirim ve Onay Akışı

## Değiştirilemez ürün adı

Repository açıklaması, uygulama adı, pencere başlığı, package metadata, artifact, installer ve GitHub Release başlığı **SatisPlanner** kullanır. `Ficsit Companion` yalnız upstream kaynak/credit bağlamında geçebilir.

## 16 slice → 16 release eşlemesi

| Milestone | Teknik slice | Display version | SemVer tag | Release türü |
|---:|---:|---:|---|---|
| 1/16 | 00 | 0.1 | `v0.1.0` | Published development |
| 2/16 | 01 | 0.2 | `v0.2.0` | Published development |
| 3/16 | 02 | 0.3 | `v0.3.0` | Published development |
| 4/16 | 03 | 0.4 | `v0.4.0` | Published development |
| 5/16 | 04 | 0.5 | `v0.5.0` | Published development |
| 6/16 | 05 | 0.6 | `v0.6.0` | Published development |
| 7/16 | 06 | 0.7 | `v0.7.0` | Published development |
| 8/16 | 07 | 0.8 | `v0.8.0` | Published development |
| 9/16 | 08 | 0.9 | `v0.9.0` | Published development |
| 10/16 | 09 | 0.10 | `v0.10.0` | Published development |
| 11/16 | 10 | 0.11 | `v0.11.0` | Published development |
| 12/16 | 11 | 0.12 | `v0.12.0` | Published development |
| 13/16 | 12 | 0.13 | `v0.13.0` | Published development |
| 14/16 | 13 | 0.14 | `v0.14.0` | Published development |
| 15/16 | 14 | 0.15 | `v0.15.0` | Published development |
| 16/16 | 15 | 1.0 | `v1.0.0` | Stable |

GitHub `pre-release` bayrağı `v0.x` için kullanılmaz. GitHub'ın ana repository
sayfası pre-release sürümleri Latest/Releases kartında göstermediği için her
doğrulanmış slice release'i normal published release olarak yayımlanır ve en
yenisi `Latest` yapılır. `v0.x` sürümlerin geliştirme aşamasında ve kararsız
olduğu; SemVer majörünün `0` olması, release başlığı ve bilinen sınırlamalarla
açıkça belirtilir.

## Slice kapanış state machine'i

```text
IMPLEMENTING
  → VERIFYING
  → COMMITTED
  → PUSHED_AND_SHA_VERIFIED
  → TAGGED
  → GITHUB_RELEASE_PUBLISHED
  → CI_AND_ARTIFACT_VERIFIED
  → USER_NOTIFIED
  → WAITING_FOR_USER_APPROVAL
      ├─ approved → NEXT_SLICE_ALLOWED
      └─ changes requested → CURRENT_SLICE_REOPENED
```

Her geçişin kanıtı Delivery Record'a yazılır. State atlamak yasaktır.

## Codex bildirim metni

Release doğrulandıktan sonra aynı görevde şu format kullanılır:

```text
SatisPlanner — Slice N/16 tamamlandı
Version: vX.Y.Z
GitHub Release: <url>
Commit: <sha>
CI: başarılı
Özet: <en önemli 2–4 sonuç>

Sonraki slice'a devam edilsin mi?
```

Bu mesaj bir bilgi notu değil, cevap gerektiren onay sorusudur. Codex görevi `WAITING_FOR_USER_APPROVAL`/`Needs input` durumunda bırakır. Kullanıcının telefonu, web'i veya masaüstü uygulaması bildirimi ChatGPT/Codex hesap ayarlarında etkin kanallardan alır. OpenAI Docs'e göre masaüstünde question notifications ayrı açılıp kapatılabilir; web kanalları hesap/kategoriye göre push, e-posta veya SMS içerebilir. Agent belirli bir kanalın teslimini garanti edemez, fakat onay sorusunu ve bekleme durumunu garanti etmek zorundadır.

## Geçerli onay ve ret

- Geçerli onay: `evet`, `devam`, `onaylıyorum`, `sonraki slice'a geç` veya açıkça eşdeğer ifade.
- Onay sayılmaz: bildirim görülmesi, emoji reaction, sessizlik, connection'ın açık olması veya CI başarısı.
- Düzeltme/ret halinde mevcut slice yeniden açılır. Düzeltme release'i aynı minor altında patch bump alır; örneğin `v0.4.0 → v0.4.1`.
- Patch release sonrası Codex güncel URL/SHA ile yeniden onay ister.

## GitHub Release içeriği

- SatisPlanner sürümü ve Slice N/16
- Tamamlanan task'lar
- Acceptance/test sonuçları
- Closing commit SHA
- Artifact/checksum bağlantıları
- Game-data/importer compatibility
- Known limitations
- Upstream credit ve gerekiyorsa license notu

## Final slice

`v1.0.0` yayımlandıktan sonra da onay sorulur: `SatisPlanner v1.0.0 kabul edilsin ve geliştirme görevi tamamlandı olarak kapatılsın mı?` Kullanıcı onayı gelmeden görev tamamlandı/arşivlendi sayılmaz.
