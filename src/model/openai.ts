import OpenAILib from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

interface OpenAIOpt {
  apiKey: string
  baseUrl: string
}

interface ChatOpt {
  model: string
  messages: ChatCompletionMessageParam[]
  maxTokens?: number
  temperature?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export class 我的OpenAI {
  private openai: OpenAILib
  private isStopped: boolean = false

  constructor(options: OpenAIOpt) {
    this.openai = new OpenAILib({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    })
  }

  async stop(): Promise<void> {
    this.isStopped = true
  }

  async chat(opt: ChatOpt & { cb: (a: string) => Promise<void> }): Promise<void> {
    this.isStopped = false

    try {
      var response = await this.openai.chat.completions.create({
        model: opt.model,
        messages: opt.messages,
        stream: true,
      })
      for await (var chunk of response) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.isStopped) break
        var c = chunk.choices[0]?.delta?.content
        if (c != null) {
          await opt.cb(c)
        }
      }
    } catch (error) {
      throw error
    }
  }

  async chatSync(opt: ChatOpt): Promise<string | null> {
    try {
      var response = await this.openai.chat.completions.create({
        model: opt.model,
        messages: opt.messages,
      })
      return response.choices[0]?.message?.content?.trim() || null
    } catch (error) {
      throw error
    }
  }
}
