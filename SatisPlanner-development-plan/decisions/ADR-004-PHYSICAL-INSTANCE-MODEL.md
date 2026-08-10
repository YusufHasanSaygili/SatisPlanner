# ADR-004 — Fiziksel Machine Instance Modeli

- Durum: Kabul edildi
- Tarih: 2026-08-10

## Karar

Canvas'taki her production machine node'u tek fiziksel building instance'ıdır. Aggregate “3.6 Constructor” node'u P0 modelinde yoktur. Çoklu makine oluşturmak duplicate/batch-create ile birden fazla stable UUID üretir.

Her instance bağımsız olarak şunları taşır:

- building ve recipe
- clock percent
- power shard count
- Somersloop count
- standby/built state
- input/output ports ve edge ilişkileri
- kullanıcı label/color/note

## Sonuç

Gerçek oyundaki hattın bire bir modellenmesi ve bottleneck tanısı mümkün olur. Planner-only aggregate görünüm ileride read-only summary olarak eklenebilir; source of truth olamaz.
