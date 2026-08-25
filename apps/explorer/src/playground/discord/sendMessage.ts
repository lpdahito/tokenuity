// docker run -it --rm --env-file .env -v /Users/lpdahito/Projects/tokenuity/trends-explorer/dist:/app/dist explorer node -e 'require("./dist/playground/discord/sendMessage.js").default()'

export default async () => {
  const url = 'https://discord.com/api/webhooks/1417671116046209076/WG-jnCXklq7Tww3r-jws24ZHVa1QFbbPZnkUMYdCJuG9xZMgKjg3cFaliMVOu1sk2WOz'
  try  {
    let botMsg = ''
    botMsg = `@everyone Bought $3.00 worth of PEPE (PEPE)\n`
    botMsg += `Try count: 1, Attempt: 1, Protocol: 2, Trust score: null, Dexscreener: false, Launchpad: null, Whales: null`

    const payload = {
      content: botMsg,
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch (err: any)  {
    if ('message' in err) {
      console.log(err.message)
    }
  }
}