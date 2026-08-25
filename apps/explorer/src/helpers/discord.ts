export const sendDiscordMessage = async (
  msg: string
) => {
  const url = 'https://discord.com/api/webhooks/1417671116046209076/WG-jnCXklq7Tww3r-jws24ZHVa1QFbbPZnkUMYdCJuG9xZMgKjg3cFaliMVOu1sk2WOz'

  try  {
    const payload = {
      content: msg,
    }

    await fetch(url, {
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