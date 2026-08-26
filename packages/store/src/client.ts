import mongoose from 'mongoose'

const globalCache = globalThis as unknown as {
  _mongoosePromise?: Promise<typeof mongoose>
}

export async function connect(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  if (!globalCache._mongoosePromise) {
    globalCache._mongoosePromise = mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10_000,
    })
  }

  return globalCache._mongoosePromise
}

export async function close(): Promise<void> {
  if (globalCache._mongoosePromise) {
    await mongoose.disconnect()
    globalCache._mongoosePromise = undefined
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1
}