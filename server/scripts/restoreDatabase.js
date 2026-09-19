/**
 * FairKart Database Isolated Restore Utility
 * Restores full backup into an isolated target database (e.g. FairKart_Restore_Test)
 * without touching the active production/development database.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const DEFAULT_RESTORE_DB_NAME = 'FairKart_Restore_Test';
const BASE_MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';

export async function restoreDatabase(backupDir = null, targetDbName = DEFAULT_RESTORE_DB_NAME) {
  // Find the latest backup directory if not specified
  const backupsRoot = path.join(__dirname, '../backups');
  let selectedBackupDir = backupDir;

  if (!selectedBackupDir) {
    if (!fs.existsSync(backupsRoot)) {
      throw new Error(`Backups directory not found at: ${backupsRoot}`);
    }
    const dirs = fs.readdirSync(backupsRoot)
      .filter(f => fs.statSync(path.join(backupsRoot, f)).isDirectory() && f.startsWith('fairkart_backup_'))
      .sort()
      .reverse();

    if (dirs.length === 0) {
      throw new Error('No backup directories found in backups folder.');
    }
    selectedBackupDir = path.join(backupsRoot, dirs[0]);
  }

  const manifestPath = path.join(selectedBackupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found in backup directory: ${selectedBackupDir}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Build target URI pointing strictly to isolated test database
  const targetUri = BASE_MONGO_URI.replace(/\/[^/?]+(\?|$)/, `/${targetDbName}$1`);

  console.log('================================================================');
  console.log('       FAIRKART ISOLATED DATABASE RESTORE UTILITY               ');
  console.log('================================================================');
  console.log(`Backup Source: ${selectedBackupDir}`);
  console.log(`Original DB:   ${manifest.database}`);
  console.log(`Target Restore DB (ISOLATED): ${targetDbName}`);
  console.log(`Target URI:    ${targetUri}\n`);

  if (targetDbName.toLowerCase() === manifest.database.toLowerCase()) {
    throw new Error('FATAL SAFETY GUARD: Target restore database cannot be the same as the active production database!');
  }

  const conn = await mongoose.createConnection(targetUri).asPromise();
  const db = conn.db;

  // Clean target test database prior to restore
  console.log(`Purging existing collections in "${targetDbName}" for clean restore...`);
  await db.dropDatabase();
  console.log(`Database "${targetDbName}" reset.\n`);

  let totalRestoredDocs = 0;
  let totalRestoredIndexes = 0;

  for (const colInfo of manifest.collections) {
    const colName = colInfo.name;
    const colFilePath = path.join(selectedBackupDir, `${colName}.json`);
    const indexFilePath = path.join(selectedBackupDir, `${colName}.indexes.json`);

    if (!fs.existsSync(colFilePath)) {
      console.warn(`  ⚠️ Missing data file for collection: ${colName}`);
      continue;
    }

    const docs = JSON.parse(fs.readFileSync(colFilePath, 'utf-8'));
    const targetCollection = db.collection(colName);

    if (docs.length > 0) {
      // Re-cast ObjectId and Dates using MongoDB EJSON or relaxed parser
      const parsedDocs = docs.map(d => parseDocumentTypes(d));
      await targetCollection.insertMany(parsedDocs, { ordered: false });
      totalRestoredDocs += docs.length;
    }

    // Reconstruct Indexes
    if (fs.existsSync(indexFilePath)) {
      const indexes = JSON.parse(fs.readFileSync(indexFilePath, 'utf-8'));
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        try {
          const indexOptions = {};
          if (idx.unique) indexOptions.unique = true;
          if (idx.sparse) indexOptions.sparse = true;
          if (idx.expireAfterSeconds !== undefined) indexOptions.expireAfterSeconds = idx.expireAfterSeconds;
          if (idx.name) indexOptions.name = idx.name;

          await targetCollection.createIndex(idx.key, indexOptions);
          totalRestoredIndexes++;
        } catch (e) {
          // Ignore non-fatal index warning (e.g. existing index)
        }
      }
    }

    console.log(`  ✓ Restored "${colName}": ${docs.length} documents, ${colInfo.indexCount} indexes`);
  }

  console.log('\n================================================================');
  console.log(`✅ RESTORE DRILL COMPLETED: ${manifest.collections.length} collections restored`);
  console.log(`   Total Documents: ${totalRestoredDocs} | Total Indexes: ${totalRestoredIndexes}`);
  console.log(`   Isolated Database: "${targetDbName}" is ready for validation.`);
  console.log('================================================================\n');

  await conn.close();
  return { targetUri, targetDbName, selectedBackupDir, totalRestoredDocs };
}

function parseDocumentTypes(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => parseDocumentTypes(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value) && (key === '_id' || key.endsWith('Id') || key === 'userId' || key === 'vendorId')) {
      result[key] = new mongoose.Types.ObjectId(value);
    } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      result[key] = new Date(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = parseDocumentTypes(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  restoreDatabase().catch(err => {
    console.error('Restore failed:', err);
    process.exit(1);
  });
}
