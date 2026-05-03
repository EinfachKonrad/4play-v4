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

const email = process.argv[2]?.trim().toLowerCase()
const password = process.argv[3]
const role = process.argv[4]?.toLowerCase() || "crew" // "crew" or role uuid"

if (!email || !password) {
  console.log("Usage: node scripts/create-user.mjs <email> <password> [roleuuid]")
  process.exit(1)
}

if (password.length < 8) {
  console.log("Passwort muss mindestens 8 Zeichen lang sein.")
  process.exit(1)
}

const client = new MongoClient(mongoUri)

try {
  await client.connect()

  const db = client.db("settings")
  const users = db.collection("crewmembers")

  const passwordHash = await hash(password, 12)

  const result = await users.updateOne(
    { email },
    {
      $set: {
        uuid: uuidv4(),
        firstName: encryptData("auto-generated"),
        lastName: encryptData("lastname"),
        email: encryptData(email),
        mustChangePassword: true,
        passwordHash,
        roleUuid: role === "crew" ? null : role,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )

  if (result.upsertedCount > 0) {
    console.log(`✅ User erstellt: ${email} (Rolle: ${role})`)
  } else {
    console.log(`✅ User aktualisiert: ${email} (Rolle: ${role})`)
  }
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Rolle: ${role}`)
} catch (error) {
  console.error("❌ Fehler beim Erstellen des Users:", error.message)
  process.exit(1)
} finally {
  await client.close()
}
