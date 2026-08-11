# Upstream davranış ve save characterization raporu

Bu rapor Slice 00 / S00-T02 kapsamında, immutable
`upstream-d5c449a` baseline'ının korunması gereken davranışlarını executable
örneklerle kaydeder. Orijinal C++ test harness'i upstream dosyalarını değiştirmeden
doğrudan derledi; `v0.11.0` parity ve migration kapıları geçildikten sonra ağır
runtime kaynaklarıyla birlikte aktif ağaçtan kaldırıldı. Kanıt sonuçları, audited
upstream commit'i ve portable `.fcs` fixture'ı korunur.

## Çalıştırma

Tarihsel harness, `v0.11.0` veya daha eski bir checkout üzerinde Visual Studio
Developer PowerShell içinde şu komutlarla çalıştırılmıştı:

```powershell
cmake -S tests/upstream-characterization -B build/upstream-characterization -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build/upstream-characterization --parallel 2
ctest --test-dir build/upstream-characterization --output-on-failure -V
```

2026-08-10 Windows/MSVC koşusunda sonuç: **1/1 PASS**, 0,32 saniye.

## Kilitlenen davranışlar

| Senaryo | Girdi | Gözlenen sonuç |
|---|---|---|
| Basit recipe chain | Iron Ore 60/min → Iron Ingot → Iron Plate | Ingot node rate `2`, ingot 60/min, plate node rate `2`, plate 40/min |
| Somersloop | Iron Plate, aggregate rate `1`, Somersloop `1` | Input 30/min, output 40/min |
| Custom splitter | Input 60/min, iki bağlı + bir boş output | `[20,20,20]`/min |
| Merger | Output 60/min, iki bağlı + bir boş input | `[20,20,20]`/min |
| Save round-trip | İki craft node + bir link, v7 | Serialize → deserialize → serialize byte/semantic eşit |

Splitter/merger'ın bağlı olmayan üçüncü pini de eşit paya katması parity için
bilinçli bir bulgudur. Yeni ürün bunu kullanıcıya görünmeyen “hayalet akış”
olarak korumamalı; bağlantı ve kapasite modeli geldiğinde beklenen yeni davranış
açık acceptance kriteriyle değiştirilmelidir.

Somersloop davranışı fiziksel slot/instance modeli değildir. `CraftNode` içindeki
`num_somersloop`, aggregate `current_rate` ile birlikte bütün craft node'a
uygulanır. Örneğin rate `2` aynı recipe'yi yapan iki fiziksel makineyi temsil
edebilir; yine de tek node yalnız bir ortak Somersloop değerine sahiptir. Bu,
Slice 07'de kaldırılması gereken ana model boşluğudur.

## `.fcs` v7 şeması

Golden örnek:
`tests/fixtures/upstream-fcs/simple-chain-v7.fcs`.

Top-level alanlar:

- `save_version`: `7`
- `game_version`: bundled data sürüm etiketi
- `production_multiplier_index`: quarter-step index; `3` = 1×
- `power_multiplier_index`: quarter-step index; `3` = 1×
- `nodes`: indeks sıralı node dizisi
- `links`: node/pin indeksleriyle bağlantı dizisi

Craft node alanları:

- `kind`: ordinal enum; Craft `0`
- `pos`: `{x,y}` graph konumu
- `rate`: exact `{num,den}` aggregate recipe/machine oranı
- `locked`: craft'ın tüm pinlerine ortak lock durumu
- `recipe`: display/name anahtarı
- `num_somersloop`: integer, fakat modelde `FractionalNumber` ile tutuluyor
- `built`: kullanıcı ilerleme işareti

Node kind ordinal sırası save contract'ıdır: Craft `0`, CustomSplitter `1`,
Merger `2`, Group `3`, GameSplitter `4`, Sink `5`. Upstream yorumları yeni
kind'ların yalnız listenin sonuna eklenmesini zorunlu tutar.

## Migration zinciri

`UpdateSave` yalnız ileri migration yapar ve sırayla şu adımları uygular:

| Geçiş | Dönüşüm |
|---|---|
| v1 → v2 | Link uçlarındaki eski `is_out` alanlarını kaldırır |
| v2 → v3 | Bütün node'lara `num_somersloop: 0` ekler |
| v3 → v4 | Craft node'lara, group içinde recursive olarak, `built: false` ekler |
| v4 → v5 | Craft/group ortak `locked: false`; organizer/sink pinlerine `locked: false` ekler |
| v5 → v6 | `production_multiplier_index: 3` ekler |
| v6 → v7 | `power_multiplier_index: 3` ekler |

Daha yeni bir save sürümü reddedilir. Parse hataları, atomik yazma, recovery,
checksum veya yedekleme yoktur. Desktop save doğrudan `std::ofstream` ile
`last_session.fcs` dosyasının üstüne yazılır.

## UI/graph sınırlamaları ve teknik borç

- Craft node bir fiziksel instance değil, `ceil(current_rate)` üzerinden birden
  fazla makineyi temsil eden aggregate'dir.
- Clock yüzdesi ve Power Shard sayısı ayrı alanlar değildir.
- Somersloop değeri aggregate craft node'a aittir; fiziksel makine izolasyonu
  sağlanmaz.
- Splitter/merger link kapasitesi, belt/pipe tier'ı veya taşıma kaybı yoktur.
- Bağlı olmayan organizer pinleri propagation denkleminde akış alabilir.
- Pin başına en fazla bir link vardır; çoklama organizer node gerektirir.
- Save linkleri kararlı kimlik yerine node/pin array indekslerine bağlıdır.
- Bilinmeyen recipe/node deserialize sırasında sessizce atlanabilir; kullanıcıya
  yapılandırılmış migration raporu verilmez.
- UI, save, graph state ve propagation büyük ölçüde `production_app.cpp` içinde
  birleşmiştir.
- Upstream otomatik test altyapısı yoktur; bu harness internal metoda erişmek
  için test-only translation unit kullanır.

## S00-T02 sonucu

Basit chain save'i, splitter/merger, Somersloop rate'i, v7 schema ve migration
notları executable kanıtla kaydedildi. Save→load eşitliği ve iki ayrı graph
propagation ailesi (craft chain ve organizer dağıtımı) doğrulandı. Upstream
kaynak dosyalarının hiçbiri değiştirilmedi.
