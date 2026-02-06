# Database Migration Guide

## Adding senderEmail Field

The `Email` model now includes a `senderEmail` field. To apply this change:

```bash
cd backend
npx prisma migrate dev --name add_sender_email
```

Or if you prefer to create the migration manually:

```sql
ALTER TABLE "Email" ADD COLUMN "senderEmail" TEXT NOT NULL DEFAULT '';
```

**Note**: If you have existing data, you'll need to update existing records with a default sender email before making the column NOT NULL, or remove the default and allow NULL temporarily.

## Migration Steps

1. **Backup your database** (if you have existing data)
2. **Run Prisma migration**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```
3. **Verify the migration**:
   ```bash
   npm run prisma:studio
   ```
   Check that the `Email` table has the `senderEmail` column

## Rollback (if needed)

If you need to rollback:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

Or manually:

```sql
ALTER TABLE "Email" DROP COLUMN "senderEmail";
```
