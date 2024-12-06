import * as vscode from 'vscode'
import { 全局变量 } from './global/global'
import { 自定义代码动作提供程序 } from './vscode/action'
import {
  genClass,
  genClassPrompt,
  genCode,
  genCodePrompt,
  genFunc,
  genFuncPrompt,
  genMethod,
  genMethodPrompt,
} from './vscode/command'
import { 初始化事件监听 } from './vscode/event'
import { 侧边栏视图提供者 } from './vscode/web-view'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log(`${全局变量.插件名称}: 插件开始运行`)

  // v1统一写在配置里
  // 但插件之前的配置规则是不要带v1, 为了适配以前的写法, 现在自动添加/v1标志
  // 会在足够长的时间后去掉
  const config = vscode.workspace.getConfiguration('lsby-vscode-ts-ai-assistant')
  let baseUrl = config.get<string>('baseUrl', 'https://api.openai.com/v1')
  if (baseUrl && !(baseUrl.endsWith('/v1') || baseUrl.endsWith('/v1/'))) {
    baseUrl = baseUrl + '/v1'
    config.update('baseUrl', baseUrl, vscode.ConfigurationTarget.Global)
    全局变量.配置.baseUrl += '/v1'
  }

  全局变量.扩展目录 = context.extensionUri

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genFunc`, genFunc))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genFuncPrompt`, genFuncPrompt))

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genMethod`, genMethod))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genMethodPrompt`, genMethodPrompt))

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genClass`, genClass))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genClassPrompt`, genClassPrompt))

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genCode`, genCode))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genCodePrompt`, genCodePrompt))

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(['typescript', 'typescriptreact'], new 自定义代码动作提供程序(), {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }),
  )
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(侧边栏视图提供者.视图id, 侧边栏视图提供者.获得实例()),
  )

  await 初始化事件监听()
}

export function deactivate(): void {}
