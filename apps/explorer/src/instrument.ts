import * as Sentry from "@sentry/node"
// import { nodeProfilingIntegration } from '@sentry/profiling-node'

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
