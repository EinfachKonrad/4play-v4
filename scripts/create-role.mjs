import { MongoClient } from "mongodb"
import { hash } from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"
import crypto from "crypto"
const method = "aes-256-cbc"

function getKeys() {
//   const crypto = getCrypto()
  const secret = process.env.SECRET_KEY
  const iv = process.env.SECRET_IV

  if (!secret) {
    throw new Error('SECRET_KEY environment variable is required for encryption')
  }
  if (!iv) {
    throw new Error('SECRET_IV environment variable is required for encryption')
  }

  const key = crypto
    .createHash('sha512')
    .update(secret)
    .digest('hex')
    .substring(0, 32)
  const encryptionIV = crypto
    .createHash('sha512')
    .update(iv)
    .digest('hex')
    .substring(0, 16)

  return { crypto, key, encryptionIV }
}

export function encryptData(data) {
  const { crypto, key, encryptionIV } = getKeys()
  const cipher = crypto.createCipheriv(method, key, encryptionIV)
  return Buffer.from(
    cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
  ).toString('base64')
}



const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lade .env.local aus dem Projekt-Root
dotenv.config({ path: resolve(__dirname, "..", ".env.local") })

const mongoUri = process.env.V4_URI

if (!mongoUri) {
  throw new Error("V4_URI fehlt. Bitte in .env.local setzen.")
}

const name = process.argv[2]?.trim()
const description = process.argv[3]?.trim()

if (!name || !description) {
  console.log("Usage: node scripts/create-role.mjs <name> <description>")
  process.exit(1)
}

const client = new MongoClient(mongoUri);
const uuid = uuidv4()

try {
  await client.connect()

  const db = client.db("settings")
  const roles = db.collection("roles")

  const result = await roles.updateOne(
    { name: encryptData(name) },
    {
      $set: {
        uuid: uuid,
        name: encryptData(name),
        description: encryptData(description),
        permissions: ["*"], // admin permission
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )

  if (result.upsertedCount > 0) {
    console.log(`✅ Rolle erstellt: ${uuid} ${name} (Beschreibung: ${description})`)
  } else {
    console.log(`✅ Rolle aktualisiert: ${uuid} ${name} (Beschreibung: ${description})`)
  }
} catch (error) {
  console.error("❌ Fehler beim Erstellen der Rolle:", error.message)
  process.exit(1)
} finally {
  await client.close()
}
