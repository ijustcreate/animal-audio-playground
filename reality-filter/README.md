# Reality Filter update channel

This folder is the stable update source for the local children's-museum Reality Filter exhibit.

The installed exhibit checks `manifest.json` when **↻ Refresh build** is pressed.
Only files listed in the manifest are downloaded, and the local updater verifies their SHA-256 hash before replacing the running UI.

Do not delete or rename `manifest.json` without updating the installed updater.
