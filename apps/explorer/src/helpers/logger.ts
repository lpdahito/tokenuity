import * as fs from 'fs'

export const createLog = (
  start: Date,
  event: string,
  logText: string,
  success: boolean = true
):void => {
  const end = new Date()
  
  const timeZone = 'America/Montreal'
  const startDate = start.toLocaleDateString('en-CA', { timeZone: timeZone })
  const startTime = start.toLocaleTimeString('en-US', { timeZone: timeZone })
  const endTime = end.toLocaleTimeString('en-US', { timeZone: timeZone })

  const path = `/var/log/${event + 's'}/${startDate}/`
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })

  const execTime = Math.floor(Number(end) / 1000) - Math.floor(Number(start) / 1000)
  const text = `[${startTime} to ${endTime} in ${execTime} secs] ~ ${logText}\n`

  const logType = success ? 'success' : 'error'

  fs.appendFileSync(path + `${logType}.log`, text)
}