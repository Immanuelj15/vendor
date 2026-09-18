import { MongoClient } from 'mongodb';

async function init() {
  console.log('Connecting to MongoDB via MongoClient on port 27018...');
  const client = new MongoClient('mongodb://127.0.0.1:27018/?directConnection=true');
  try {
    await client.connect();
    console.log('Connected!');
    const adminDb = client.db('admin');
    
    // Check replica set status or initiate
    try {
      const status = await adminDb.command({ replSetGetStatus: 1 });
      console.log('Replica set status:', status.set);
    } catch (err) {
      console.log('Replica set not initiated, initiating now...');
      const res = await adminDb.command({
        replSetInitiate: {
          _id: "rs0",
          members: [{ _id: 0, host: "127.0.0.1:27018" }]
        }
      });
      console.log('Initiate result:', res);
    }
  } catch (e) {
    console.error('Error initiating replica set:', e);
  } finally {
    await client.close();
    console.log('Disconnected');
  }
}

init();
