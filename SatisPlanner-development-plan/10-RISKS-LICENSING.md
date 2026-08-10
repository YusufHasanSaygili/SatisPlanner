# Risk, Lisans ve Güvenlik Planı

## Öncelikli riskler

| Risk | Etki | Azaltma |
|---|---|---|
| Docs schema/alanları patch ile değişir | Import kırılır | Adapter, fixture matrix, provenance, fail-loud validation |
| Icon telif/dağıtım riski | Release kaldırma riski | Repo/release'e koymama, user-local cache, özgün fallback |
| Aggregate upstream save'i instance'lara belirsiz dönüşür | Veri kaybı | Preview, açık expansion stratejisi, dönüşüm raporu, orijinali koruma |
| Graph loop'larında çözüm yakınsamaz | Yanlış rate | SCC, iteration limit, unresolved diagnostic |
| Büyük graph render/hız sorunu | Kullanılabilirlik | Incremental compute, memoization, worker, benchmark gate |
| Game-mode multiplier semantiği yanlış yorumlanır | Hatalı plan | Resmi patch + in-game characterization fixture gate |
| Rewrite scope taşar | Release gecikir | P0 sınırı, slice bağımlılıkları, extension points |

## Upstream lisansı

Upstream MIT lisanslıdır. Kullanılan önemli kaynak bölümlerinde copyright ve izin metni korunur. README/CREDITS, orijinal repo ve geliştiriciyi açıkça belirtir. Tam yeniden yazım yapılsa dahi davranış ve ilham kredisi silinmez.

## Satisfactory verisi ve görselleri

- Official Wiki, Docs dosyalarının açık bir lisans taşımadığını belirtiyor.
- Upstream README, oyun görsellerinin Coffee Stain fikri mülkiyeti olduğunu açıkça söylüyor.
- Bu nedenle ham Docs dump'ı veya extracted iconlar dağıtım artifact'ına konmaz.
- Uygulama yalnız kullanıcının sahip olduğu yerel kurulumdan okur ve app-owned cache oluşturur.
- `SatisPlanner` adı ve özgün logosu, Coffee Stain Studios tarafından hazırlanmış/resmî bir ürün izlenimi yaratmayacak fan-tool disclaimer'ı ile sunulur.

## Güvenlik

- Filesystem allowlist ve canonical-path doğrulaması
- Oyun kurulumuna yalnız read access
- Cache ve save için atomic write + temp + rename
- JSON boyut/derinlik limitleri ve parser hata izolasyonu
- Untrusted save/Docs içeriğini HTML olarak render etmeme
- Optional extractor sidecar varsa checksum/signature, explicit consent ve sandbox değerlendirmesi

## Karar kapıları

1. Rewrite onayı
2. Icon extraction yönteminin hukuk/güvenlik onayı
3. 1.2 game-mode multiplier semantiğinin oyun içi doğrulaması
4. Upstream `.fcs` migration kalite eşiği
5. Release öncesi üçüncü taraf lisans taraması
