import { MongoClient } from 'mongodb';

if (!process.env.V4_URI) {
  throw new Error('Bitte setze die Umgebungsvariable V4_URI in .env.local');
}

const uri = process.env.V4_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise_v4) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise_v4 = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise_v4;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
