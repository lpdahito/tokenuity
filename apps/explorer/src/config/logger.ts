import * as Sentry from "@sentry/node"
// import { nodeProfilingIntegration } from '@sentry/profiling-node'

import isLocal from './isLocal.js'
import { chain } from './chain.js'

interface ErrorArgs {
  error: any,
  report?: boolean
}

const INSTANCE_FUNCTION_TYPE = process.env.INSTANCE_FUNCTION_TYPE

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://971b00626d584bbe89c243546fafd9b1@o4504754839552000.ingest.us.sentry.io/4504754842370048",
  integrations: [
    // Add our Profiling integration
    // nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})

export class Logger {
  static err(
    args: ErrorArgs
  ): void {
    // if (isLocal) {
    //   if ('message' in args.error) {
    //     console.error(args.error.message)
    //   }
    // }


    // if (args.report) { Sentry.captureException(args.error) }
  }
  
  static msg(
    message: string,
  ): void {
    // if (isLocal) { console.log(message) }
  }
}

export const randomLog = (
): boolean => {
  const arr = [...Array(100).keys()].map(i => i + 1)
  const _random = arr[Math.floor(Math.random()*arr.length)]

  let _shouldLog = _random === 3
  return _shouldLog
}