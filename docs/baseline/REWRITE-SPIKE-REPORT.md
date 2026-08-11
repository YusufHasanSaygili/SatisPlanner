# SatisPlanner kontrollü rewrite spike raporu

Bu rapor Slice 00 / S00-T03 karar kapısını kapatır. Disposable spike kodu
`spikes/rewrite` altında doğrulandı ve üretim workspace'ine hiç katılmadı;
`v0.11.0` parity/migration kapıları geçildikten sonra aktif ağaçtan kaldırıldı.
Ölçümler ve karar kaydı burada, kaynak ise immutable Git geçmişinde korunur.

## Ölçüm ortamı

- Tarih: 2026-08-10
- OS: Windows 11 `10.0.22631`, x64
- Browser: Microsoft Edge 151, headless, 1440×900 viewport
- Node.js: 24.13.1; pnpm: 11.16.0
- React: 19.2.8; React Flow: 12.11.2; Vite: 8.2.1
- Rust: 1.97.1; Cargo: 1.97.1
- Tauri: 2.11.5; WebView2: 151.0.4129.72

Paketler exact version ile tanımlandı; `pnpm-lock.yaml` ve `Cargo.lock`
bağımlılık çözümünü sabitler.

## 200 node React Flow spike

Canvas, 200 bağımsız fiziksel Constructor instance'ı ve 199 edge içerir.
Domain planı React Flow node'larından ayrıdır; graph node'ları projection'dır.

`pnpm benchmark` sonucu:

```json
{
  "nodeCount": 200,
  "edgeCount": 199,
  "singleNodeUpdateMs": 10.8,
  "panZoom20FramesMs": 111.1,
  "browser": "Microsoft Edge (headless)"
}
```

20 ardışık pan/zoom frame'i ortalama yaklaşık 5,56 ms/frame sürmüştür. Bu
sonuç 200-node karar spike'ı için yeterlidir; 500/800 edge ürün bütçesini veya
düşük donanım davranışını kanıtlamaz. Bunlar Slice 13 performans kapısında
tekrarlanacaktır.

Son kalite-kapısı tekrarında tek-node sonucu 8,3 ms ölçüldü; karar kaydı daha
konservatif olan ilk 10,8 ms sonucunu kullanır. Pan/zoom sonucu iki koşuda da
111,1 ms olmuştur.

## Typed domain command

`src/domain.ts`, `machine.set-clock` komutunu UI ve Tauri'den bağımsız uygular.
Komut:

- `1..250` clock aralığını doğrular,
- stable/branded machine id ile hedefi bulur,
- source planı mutate etmez,
- yalnız hedef machine nesnesini değiştirir,
- bulunamayan id ve aralık hatasını typed sonuçla döndürür.

Vitest: **2/2 PASS**. 200 aynı recipe instance'ından yalnız `machine-137`
100%→200% değişmiş, diğer 199 instance 100% kalmış ve source plan değişmemiştir.

Bu spike yalnız command boundary ve instance isolation kanıtıdır. Shard/sloop,
exact units ve tam schema Slice 02 kapsamındadır.

## Tauri scoped-file probe

Frontend, Tauri dialog capability'siyle kullanıcının seçtiği tek JSON yolunu
Rust command'ına gönderir. Rust tarafı:

- yolu canonicalize eder,
- yalnız `.json` regular file kabul eder,
- 64 MiB üst sınırı uygular,
- `OpenOptions` ile `read(true), write(false)` açar,
- probe öncesi/sonrası modified timestamp'i raporlar.

Capability listesi yalnız `core:default` ve `dialog:allow-open` içerir; genel
filesystem plugin izni verilmemiştir.

Kanıtlar:

- Rust unit test: **1/1 PASS**; byte içeriği ve modified timestamp değişmedi.
- `cargo check`: PASS.
- `pnpm tauri build --no-bundle`: PASS, release executable 9.053.184 bayt.
- Release executable üç saniyelik runtime smoke boyunca beklenmedik çıkış
  yapmadı.

Spike command'ı yalnız ilk dört byte'ı okur. Gerçek Docs parse/normalize,
allowlist/provenance ve UTF-16 desteği Slice 03 kapsamındadır.

## Upstream parity kararı

| Upstream davranışı/parçası | Rewrite yönü |
|---|---|
| Exact fractional material rate | Korunur; typed rational/units paketi olarak yeniden uygulanır |
| Node/pin/link graph fikri | Korunur; domain source of truth + React Flow projection olur |
| Craft-chain propagation | Characterization fixture üzerinden parity sağlanır |
| Splitter/merger/group yaklaşımı | Açık allocation stratejileriyle yeniden uygulanır |
| `.fcs` v1→v7 migration bilgisi | Importer ve conversion report olarak korunur |
| MIT copyright/credit/disclaimer | Korunur |
| Aggregate CraftNode | Kaldırılır; her node tek fiziksel instance olur |
| Bağlı olmayan organizer pininde hayalet akış | Kaldırılır; diagnostic/explicit strategy gerekir |
| Array-index link persistence | Stable UUID/port id ile değiştirilir |
| `production_app.cpp` UI+save+solver birleşimi | Domain, calculation, graph adapter ve platform katmanlarına ayrılır |
| Bundled Coffee Stain iconları | Yeni release'e taşınmaz; user-local cache + özgün fallback kullanılır |

## Rewrite/refactor maliyet ve risk değerlendirmesi

Kontrollü rewrite'ın ana maliyeti mevcut propagation ve `.fcs` migration
davranışlarının yeniden uygulanmasıdır. Bu risk, immutable upstream tag,
executable characterization fixtures ve P0 parity/migration kapılarıyla
sınırlandırılır. Eski runtime bu kapılar geçmeden silinmez.

C++ çekirdeğini yerinde refactor etmek kısa vadede save/propagation kodunu
yeniden kullanırdı; ancak aggregate `current_rate`, Somersloop ve power modeli
`CraftNode`, pins, render ve persistence'a birlikte gömülüdür. Fiziksel
instance invariant'ına geçiş yine çekirdek model ve UI'nın geniş çaplı yeniden
yazılmasını gerektirecektir. Upstream'de otomatik test katmanı bulunmaması bu
refactor seçeneğinin risk avantajını daha da azaltır.

React Flow spike'ı 200-node karar eşiğini, typed core spike'ı UI'sız testi ve
Tauri probe'u dar native boundary'yi doğruladığından kontrollü rewrite seçeneği
kabul edilmiştir.

## Sonuç

ADR-001 **Kabul edildi**. Yeni stack ayrı dizinde kuruldu; P0 parity ve `.fcs`
migration raporu `v0.11.0` ile tamamlandıktan sonra eski C++ runtime ve disposable
spike aktif ağaçtan silindi. Audited commit/tag ve raporlar geçmişte korunur.
