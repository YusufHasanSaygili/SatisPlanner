# Hedef Mimari

## Önerilen stack

- **Desktop:** Tauri 2
- **UI:** React + TypeScript + Vite
- **Graph:** `@xyflow/react`
- **Native sınır:** Rust; yalnızca install discovery, izinli filesystem erişimi, atomik yazma ve opsiyonel asset adapter'ları
- **Core:** Framework bağımsız TypeScript domain, calculation ve game-data paketleri
- **Test:** Vitest tabanlı unit/integration, Playwright E2E/visual, Rust unit testleri
- **Paket yönetimi:** workspace/monorepo; kesin sürümler lockfile ile sabitlenir

## Katmanlar

```text
apps/desktop-ui
  ├─ graph canvas / inspector / library
  └─ application commands
packages/domain
  ├─ ids, units, invariants, plan schema
  └─ migration contracts
packages/game-data
  ├─ normalized catalog + snapshots
  └─ Docs parser / diff / validation
packages/calculation
  ├─ machine/extractor formulas
  ├─ flow propagation
  └─ diagnostics
packages/graph-adapter
  └─ domain graph ↔ React Flow projection
src-tauri
  ├─ install discovery
  ├─ scoped file access
  └─ atomic save / local asset cache
```

## Sınır kuralları

- React Flow node/edge objeleri source of truth değildir; domain planın görsel projeksiyonudur.
- UI hiçbir Satisfactory formülünü doğrudan hesaplamaz.
- Rust ve frontend arasında versioned request/response contract kullanılır.
- Import edilen ham Docs verisi doğrudan graph'a girmez; validate → normalize → snapshot sırasından geçer.
- Calculation engine, graph view olmadan test edilebilir.
- Importer yokken bundled minimal fallback catalog ile örnek plan açılabilir; fallback açıkça etiketlenir.

## Çalışma modeli

1. Kullanıcı aksiyonu domain command'e çevrilir.
2. Command invariant'ları doğrular ve immutable plan değişikliği üretir.
3. Calculation engine etkilenen altgraph'ı yeniden değerlendirir.
4. Diagnostics store sonucu UI'ya verir.
5. Graph adapter yalnızca görünüm node/edge'lerini günceller.
6. Autosave debounced ve atomik şekilde schema-versioned dosya yazar.

## Performans yönü

- Node/edge kimlikleri stable UUID olur.
- Calculation result memoization ve dependency graph kullanır.
- Büyük graph hesabı Web Worker'a taşınabilir; API ilk günden serializable tasarlanır.
- Görsel node bileşenleri küçük selector'larla yalnız ilgili instance değiştiğinde render edilir.

## Web sürümü

Core paketler web uyumlu tutulur. Ancak kurulu oyun keşfi ve icon cache desktop capability'dir. Web sürümü P1'de manual snapshot upload veya read-only paylaşım ile sınırlanabilir.
