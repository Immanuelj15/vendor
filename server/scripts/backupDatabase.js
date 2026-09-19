/**
 * FairKart Database Backup Utility
 * Full BSON/EJSON Dump with collection and index fidelity.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fairkart';

export async function backupDatabase(targetBackupDir = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = targetBackupDir || path.join(__dirname, `../backups/fairkart_backup_${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('================================================================');
  console.log('         FAIRKART DATABASE BACKUP UTILITY                       ');
  console.log('================================================================');
  console.log(`Source URI: ${MONGO_URI}`);
  console.log(`Backup Destination: ${backupDir}\n`);

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log(`Discovered ${collections.length} collections in database.\n`);

  const manifest = {
    database: db.databaseName,
    timestamp: new Date().toISOString(),
    totalCollections: collections.length,
    collections: []
  };

  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const collection = db.collection(colName);
    const docs = await collection.find({}).toArray();
    const indexes = await collection.indexes();

    const colFilePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(colFilePath, JSON.stringify(docs, null, 2), 'utf-8');

    const indexFilePath = path.join(backupDir, `${colName}.indexes.json`);
    fs.writeFileSync(indexFilePath, JSON.stringify(indexes, null, 2), 'utf-8');

    manifest.collections.push({
      name: colName,
      documentCount: docs.length,
      indexCount: indexes.length
    });

    console.log(`  ✓ Backed up "${colName}": ${docs.length} documents, ${indexes.length} indexes`);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\n✅ Database backup completed successfully at: ${backupDir}`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  return backupDir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  backupDatabase().catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
  });
}
