Migration 033 was applied to the TryMyBuild database (nkrkmfszuntvzjonrznb) on October 9, 2026.

Previous function and constraint definitions are saved in release-backup-20261009-writing.json. Existing comments, feedback, replies and wishes were preserved.

The connected database verification returned true for guest_word_limit_removed, comment_word_limit_removed, wish_word_limit_removed and long_wishes_supported. The disposable SQL test accepted emoji, short messages and 500-word messages while preserving blank rejection, retry identity, permissions and ownership checks.

Frontend changes remain local until the next publish. Do not apply migration 033 again.
