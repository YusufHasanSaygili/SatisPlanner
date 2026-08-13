# Backup and Recovery

Desktop autosave uses atomic replacement below the application-data directory. Before replacing a
valid plan, SatisPlanner retains a last-good revision. Temporary/lock files detect interrupted writes.
If primary data is invalid, the inspector offers **Recover last-good** or **Keep current plan**.

For a portable backup, open **Save, import & migration** and choose **Export canonical plan**. Store
the resulting `.satisplan.json` outside the application-data directory. Import is preview-first:
schema migrations, active-snapshot mismatch and unresolved recipes are shown before any change.
Canceling leaves the current plan and source file untouched.

Uninstall removes program files but deliberately keeps plans, snapshots and cache data. Back up the
application-data directory before manually deleting it or moving to another computer.
