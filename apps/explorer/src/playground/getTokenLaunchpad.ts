// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/getTokenLaunchpad.js").default()'

// Import Sentry before any other modules
import './../instrument.js'

// Sentry.init({ dsn: 'https://971b00626d584bbe89c243546fafd9b1@o4504754839552000.ingest.us.sentry.io/4504754842370048' })

import { getTokenLaunchpad, } from '../helpers/tokens.js'

let a = '0x2bf1c6bdb119d865cf9d576341d3be4ba9d3eb97' // clean

export default async () => {
  try  {
    let launchpad = await getTokenLaunchpad(a)
    
    console.log('Launchpad:', launchpad)
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  }
}