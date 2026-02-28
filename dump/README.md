# Database Backup & Restore

This folder contains database exports from the NomadNotes MongoDB database.

## Export Database

To create a new backup of the database:

```bash
node scripts/exportDatabase.js
```

This will create a timestamped folder with JSON files for each collection.

## Import/Restore Database

To restore a database from a backup:

```bash
node scripts/importDatabase.js <export-folder-name>
```

Example:
```bash
node scripts/importDatabase.js export-2026-02-28T17-49-19-493Z
```

**Warning:** The import script will DELETE all existing data in the collections before importing. Make sure you have a backup before running this command.

## Export Contents

Each export folder contains:
- JSON files for each collection (users, trips, matches, messages, etc.)
- `metadata.json` - Information about the export (date, collections included)

## Collections Exported

- users
- trips
- matches
- messages
- notifications
- gearrentals
- rentalbookings
- wallettransactions
- pages
- profilefieldoptions
- sitesettings
- newsletters
- packingitems

## Notes

- Exports are in JSON format for easy readability and version control
- Each export is timestamped to prevent overwriting
- Credentials in metadata.json are masked for security
- The import script clears existing data before importing (be careful!)
