import { MongoClient } from 'mongodb';

// Source - https://stackoverflow.com/a/79892633
// Posted by Xoosk
// Retrieved 2026-05-11, License - CC BY-SA 4.0
// fix or some wild DNS issues with MongoDB Atlas clusters that only appears in some envoirments

import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);


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
