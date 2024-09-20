import * as vscode from 'vscode'
import { 人设 } from '../character/character'

export type 全局变量类型 = {
  插件名称: string
  扩展目录: null | vscode.Uri
  配置: {
    apiKey: string
    baseUrl: string
    modelName: string
    systemPrompt: string
    otherPrompt: string | null
    parseBody: boolean
    nodeModulesMaxDeep: number
  }
}
export var 全局变量: 全局变量类型

async function 初始化全局变量(): Promise<void> {
  var 插件名称 = 'lsby-vscode-ts-ai-assistant'
  var 配置 = vscode.workspace.getConfiguration(插件名称)
  var apiKey = 配置.get<string>('apiKey')
  var baseUrl = 配置.get<string>('baseUrl')
  var modelName = 配置.get<string>('modelName')
  var systemPromptCharacter = 配置.get<string>('systemPromptCharacter') as keyof typeof 人设 | null
  var systemPromptCustom = 配置.get<string>('systemPromptCustom')
  var otherPrompt = 配置.get<string>('otherPrompt') || null
  var parseBody = 配置.get<string>('parseBody')
  var nodeModulesMaxDeep = 配置.get<string>('nodeModulesMaxDeep') || ''

  var systemPrompt = 人设['AI助手']
  if (systemPromptCustom) systemPrompt = systemPromptCustom
  else if (systemPromptCharacter && 人设[systemPromptCharacter]) systemPrompt = 人设[systemPromptCharacter]

  if (!baseUrl || !modelName || !systemPromptCharacter) {
    void vscode.window.showInformationMessage(`请先进行配置`)
    throw new Error('请先进行配置')
  }

  var nodeModulesMaxDeep默认值 = 5

  全局变量 = {
    插件名称: 插件名称,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    扩展目录: 全局变量?.扩展目录 || null,
    配置: {
      apiKey: apiKey || '',
      baseUrl,
      modelName,
      systemPrompt,
      otherPrompt,
      parseBody: parseBody == 'yes',
      nodeModulesMaxDeep: parseInt(nodeModulesMaxDeep) || nodeModulesMaxDeep默认值,
    },
  }
}
初始化全局变量().catch(console.error)

vscode.workspace.onDidChangeConfiguration(async () => {
  await 初始化全局变量()
})
