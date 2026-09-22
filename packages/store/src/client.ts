import mongoose from 'mongoose'

const cache = globalThis as unknown as {
  _mongoosePromise?: Promise<typeof mongoose>
}

export async function connect(): Promise<typeof mongoose> {
  let name = 'tokenuity-base'

  switch (process.env.CHAIN_ID) {
    case '56':
      name = 'tokenuity-bsc'; break;

    case '8453':
      name = 'tokenuity-base'; break;
  }
  
  // const uri = process.env.MONGODB_URI
  const uri = 'mongodb://mongo-server:27017/' + name + '?replicaSet=rs0'

  if (!uri) throw new Error('MONGODB_URI is not set')

  if (!cache._mongoosePromise) {
    cache._mongoosePromise = mongoose.connect(uri, {
      autoIndex: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    })
  }

  return cache._mongoosePromise
}

export async function close(): Promise<void> {
  if (cache._mongoosePromise) {
    await mongoose.disconnect()
    cache._mongoosePromise = undefined
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1
}