# SatisPlanner upstream baseline envanteri

Bu kayıt, Slice 00 / S00-T01 için `adepierre/ficsit-companion` kaynağının
değişmez başlangıç durumunu belgeler. Bu kaynak yalnız davranış, format ve
lisans referansıdır; ürün adı SatisPlanner'dır.

## Kimlik ve yeniden üretilebilirlik

| Alan | Değer |
|---|---|
| Upstream | `https://github.com/adepierre/ficsit-companion.git` |
| Tam commit | `d5c449adebe335cf326b6cb2d49c106888fc06c8` |
| Commit tarihi | 2026-06-14 11:35:55 +0100 |
| Yerel baseline tag'i | `upstream-d5c449a` (annotated) |
| Çalışma branch'i | `slice/00-upstream-baseline` |
| Upstream sürüm tag'i | `v1.2.2` aynı commit'i gösteriyor |
| Ana lisans | MIT, Copyright (c) 2024 adepierre |

Doğrulama komutları:

```powershell
git show --no-patch --format=fuller upstream-d5c449a
git rev-parse upstream-d5c449a^{}
git ls-remote upstream refs/heads/main refs/tags/v1.2.2
```

Beklenen commit her üç kontrolde de
`d5c449adebe335cf326b6cb2d49c106888fc06c8` değeridir. Upstream tag'leri
yerel sürüm uzayına alınmadı; SatisPlanner'ın `v0.1.0` release tag'i ile
upstream'in tarihî `v0.1.0` tag'inin çakışması böylece önlenir.

## Kaynak ve build envanteri

- Uygulama C++17 ve CMake 3.15+ kullanıyor.
- Desktop hedefi SDL2 + OpenGL üzerinde Dear ImGui ve ImGui Node Editor
  kullanıyor.
- Web hedefi Emscripten/WASM üretiyor; upstream CI Emscripten 4.0.5'i
  sabitliyor.
- CI desktop build'ini Windows, Ubuntu ve macOS üzerinde; web build'ini
  Ubuntu üzerinde çalıştırıyor.
- Otomatik unit/integration/E2E testi tanımlı değil. Workflow yalnız build,
  install ve kısa ömürlü artifact üretimi yapıyor.
- Uygulama kaynak ağacında 25 dosya ve 16.407 satır var. Bundled
  `stb_image.h`, `json.hpp` ve `json.cpp` dışarıda bırakıldığında ürün
  kaynakları 21 dosya / 6.963 satırdır.
- `production_app.cpp` 3.920 satırdır; UI, persistence ve graph propagation
  sorumluluklarının aynı dosyada toplanması rewrite karar kapısındaki temel
  teknik risklerden biridir.

### Sabitlenen/fetched bağımlılıklar

| Bağımlılık | Kaynak | Sürüm/commit |
|---|---|---|
| Dear ImGui fork | `thedmd/imgui` | `4981fef6649c1c9204f39641fff7d06cc2b1acfe` |
| ImGui Node Editor | `thedmd/imgui-node-editor` | `e78e447900909a051817a760efe13fe83e6e1afc` |
| SDL2 fallback | `libsdl-org/SDL` | `release-2.30.5` |
| Emscripten (CI) | `emscripten-core/emsdk` | `4.0.5` |
| OpenGL | Sistem paketi | CMake `find_package(OpenGL REQUIRED)` |

FetchContent girdileri commit/tag ile sabitlenmiş olsa da dependency lisans
metinleri upstream repository içinde vendored değildir. Yeni dağıtım için
third-party notice üretimi Slice 14'e kadar zorunlu takip maddesidir.

### Yerel build ortamı — 2026-08-10

- Visual Studio 2022 Community ve MSVC `14.38.33130` kurulu.
- Visual Studio ile gelen CMake ve Ninja dosyaları mevcut, ancak genel
  `PATH` içinde değiller; build komutları Developer Shell veya tam yol
  kullanmalı.
- Node.js `24.13.1`, npm `11.8.0`, pnpm `11.16.0` ve Python `3.10.10`
  mevcut.
- Rust/Cargo genel `PATH` içinde yok. Bu durum S00-T03 Tauri probe başlamadan
  giderilmesi gereken araç zinciri eksiğidir.

## Veri ve artwork envanteri

| Sınıf | Dosya | Bayt | Yeni release politikası |
|---|---:|---:|---|
| C++ kaynakları | 25 | 585.162 | Parity tamamlanana kadar korunur |
| Build tanımları | 4 | 2.134 | Baseline kanıtı olarak korunur |
| CI | 2 | 6.528 | Baseline kanıtı olarak korunur |
| Extractor araçları | 2 | 9.967 | İncelenir; ham oyun verisi üretme yetkisi varsayılmaz |
| Normalize game data | 1 | 201.432 Git blob baytı | Yalnız baseline; yeni release'e otomatik taşınmaz |
| Oyun ikonları | 153 | 1.836.852 | Coffee Stain artwork; yeni release'e taşınmaz |
| Uygulama ikonu | 1 | 59.575 | Kaynağı doğrulanana kadar artwork karantinasında |
| Emscripten shell | 1 | 9.065 | Baseline kanıtı olarak korunur |
| Legal/docs | 3 | 7.591 | MIT/credit/disclaimer korunur |

`assets/satisfactory.json` çalışma kopyası:

- `version`: `1.2`
- buildings: 15
- items: 152
- recipes: 293
- dosya boyutu: 208.959 bayt (Windows çalışma ağacı)
- SHA-256: `013901f8fcc041d6e91aac36d3c1a679a777088286834b632d3f8c9a4576201e`
- Git blob kimliği: `121c98695c6866e46bd7b095d49b5c4d84057944`

README, tariflerin oyun sürümü 1.0 ile güncel olduğunu söylüyor; aynı
commit'teki JSON ise açıkça 1.2 olarak işaretli. Sürüm etiketi tek başına
güvenilir provenance değildir. Yeni importer kaynak yolu, locale, game build,
dosya checksum'u, importer sürümü ve import zamanını kaydetmelidir.

## Lisans, credit ve disclaimer kontrolü

- [x] Root `LICENSE` MIT metnini ve adepierre copyright kaydını içeriyor.
- [x] README, Dear ImGui ve ImGui Node Editor projelerine credit veriyor.
- [x] README, aracın Coffee Stain Studios'un resmî ürünü olmadığını söylüyor.
- [x] README, görsellerin Satisfactory/Coffee Stain fikrî mülkiyeti olduğunu
  açıkça kaydediyor.
- [x] Upstream kaynak kodu ve geçmişi immutable tag ile korunuyor.
- [x] 153 generated/extracted oyun ikonu SatisPlanner release'ine
  taşınmayacak olarak sınıflandırıldı.
- [ ] Dependency license/notice matrisi release öncesinde tamamlanmalı.
- [ ] SatisPlanner'a özgü fan-tool disclaimer ve trademark metni final
  packaging öncesinde hukuk/ürün incelemesinden geçmeli.

## S00-T01 sonucu

Baseline SHA/tag, build ve dependency manifesti, lisans kayıtları, dosya
sınıflandırması ve 1.2 JSON sayımları doğrulandı. Upstream kaynaklarında veya
asset'lerinde silme/değiştirme yapılmadı. Görev kapanışı için bu raporun ve
plan paketinin commit edilmesi, temiz çalışma ağacı kontrolü ve tag'in hedef
remote'a push kanıtı gereklidir; bunlar Slice 00 kapanış akışında kaydedilecek.

### Desktop build smoke kanıtı

2026-08-10 tarihinde Windows 11 / MSVC 19.38.33133 / Ninja ile aşağıdaki
baseline kontrolü başarılı oldu:

1. CMake configure tamamlandı; OpenGL bulundu ve SDL 2.30.5 FetchContent ile
   çözüldü.
2. Ninja'nın 317 build adımı hatasız tamamlandı.
3. `ficsit-companion.exe` (2.752.000 bayt) üretildi.
4. Executable kendi build dizininden başlatıldı, üç saniyelik smoke süresince
   beklenmedik çıkış yapmadı ve probe sonunda kontrollü biçimde kapatıldı.

Bu yalnız desktop build/runtime başlangıç kanıtıdır. Save round-trip ve iki
graph propagation characterization senaryosu S00-T02 kapsamındadır.
