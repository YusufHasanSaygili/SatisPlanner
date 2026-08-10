# ADR-002 — Game Data Source of Truth

- Durum: Kabul edildi
- Tarih: 2026-08-10

## Karar

Game data dört kaynağa ayrılır:

1. `docs-derived`: Kullanıcının kurulumundaki localized Docs dump
2. `versioned-rule-pack`: Docs'ta bulunmayan veya güvenilir olmayan purity, tier capacity ve davranış kuralları
3. `user-plan`: Kullanıcının seçtiği instance/tier/profile ayarları
4. `fallback-catalog`: Oyun kurulu değilken demo ve recovery için minimal özgün veri

Her normalized catalog; source hash, importer version, locale ve game/build version provenance taşır.

## Reddedilen seçenek

Wiki'den statik JSON kopyalamak veya repo içindeki `version: 1.2` etiketini tek başına doğruluk kanıtı saymak reddedildi. Patch güncellemeleri ve README/asset çelişkisi bu yaklaşımı kırılgan yapar.
