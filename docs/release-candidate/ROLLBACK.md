# v1.0.0 Rollback Plan

1. Never move or delete the annotated `v1.0.0` tag. Git history and published checksums remain immutable
   evidence even if the release is withdrawn.
2. If an artifact is unsafe, mark the GitHub Release non-Latest and add a prominent withdrawal note;
   do not silently replace assets under the same tag.
3. Restore the last verified stable release (`v0.15.0`) as Latest and link the incident.
4. Fix on a new branch, run the complete quality/clean-machine/supply-chain gates, then publish a new
   SemVer patch such as `v1.0.1` with new checksums, SBOM and attestations.
5. Plan data is forward-migrated preview-first. Users should export a backup before opening it with a
   newer patch; rollback never deletes app-owned plans.
