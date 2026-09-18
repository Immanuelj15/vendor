# FairKart / Babu Super Market — Disaster Recovery Manual

This document details database backups, recovery procedures, retention rules, and disaster response protocols for the platform.

## 1. MongoDB Backup Strategy

### Backup Frequency Recommendation
* **Daily Backups**: Full logical backup of the primary database node.
* **Hourly Backups**: Incremental backups of oplog entries to enable Point-in-Time Recovery (PITR).
* **Retention Policy**: 
  * Keep hourly incremental backups for 7 days.
  * Keep daily backups for 30 days.
  * Keep monthly backups for 1 year.

---

## 2. Backup Execution Procedure

Use `mongodump` to generate consistent logical database snapshots.

### Command Syntax (Logical Backup)
```bash
mongodump --uri="mongodb://username:password@hostname:port/database" --out=/backups/$(date +%F) --gzip --oplog
```
* `--gzip`: Compress the output files.
* `--oplog`: Ensure transaction consistency by capturing changes written during the dump execution.

---

## 3. Restore and Recovery Procedure

In case of data corruption, system failure, or hardware degradation, execute `mongorestore` to recover state.

### Command Syntax (Complete Restore)
```bash
mongorestore --uri="mongodb://username:password@hostname:port/database" --dir=/backups/target-backup-folder --gzip --drop
```
* `--drop`: Drops target collections before restoring from the backup archive.
* Use this flag with extreme caution in production environments.

### Point-in-Time Recovery (PITR)
To replay the oplog up to a specific transaction timestamp:
```bash
mongorestore --uri="mongodb://..." --oplogReplay --oplogLimit=timestamp:ordinal /backups/oplog-folder
```

---

## 4. Disaster Recovery Considerations

### Replica Set Failover
If the Primary database node becomes unreachable:
1. The remaining Secondary nodes will automatically trigger an election.
2. A new Primary is elected within 2-5 seconds.
3. Node.js applications configured with replica set connection strings (e.g. `mongodb://host1,host2,host3/?replicaSet=rs0`) automatically reconnect to the new Primary.

### Standalone Failure Recovery
If running in a standalone single-node deployment (e.g. during local testing on port 27018):
1. Immediately restart the daemon process: `& "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --replSet rs0 --dbpath c:\path\to\db-data --port 27018`
2. If data files are corrupted, restore the last healthy snapshot using `mongorestore --drop`.
