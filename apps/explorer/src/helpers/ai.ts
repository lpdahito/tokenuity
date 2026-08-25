import OpenAI from 'openai'

import { Logger } from './../config/logger.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getSnippetTrustScore = async (
  snippet: string
): Promise<number> => {
  let trustScore = 0

  try {
    // const models = await openai.models.list();
    // models.data.forEach((m) => console.log(m.id));

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o', // or 'gpt-3.5-turbo'
      messages: [
        { role: 'system', content: 'As an ERC20 safety expert, you assign trust scores (1 to 10) to code samples. You only answer with a number.' },
        { role: 'user', content: 'Rate this code snippet: ' + snippet }
      ],
    })

    const _trustScore = chatCompletion.choices[0].message.content
    trustScore = Number(_trustScore)
  } catch (err: any) {
    console.log(err)
    Logger.err({ error: err, report: true })
  } finally {
    return trustScore
  }
}