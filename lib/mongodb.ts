import { MongoClient } from 'mongodb';

if (!process.env.V4_URI) {
  throw new Error('Bitte setze die Umgebungsvariable V4_URI in .env.local');
}

const uri = process.env.V4_URI;

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClient_v4) {
    client = new MongoClient(uri);
    (global as any)._mongoClient_v4 = client;
  }
  clientPromise = Promise.resolve((global as any)._mongoClient_v4 as MongoClient);
} else {
  client = new MongoClient(uri);
  clientPromise = Promise.resolve(client);
}

export default clientPromise;
