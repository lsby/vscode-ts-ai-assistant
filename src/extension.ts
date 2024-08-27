import * as vscode from 'vscode'
import { 全局变量 } from './global/global'
import { 自定义代码动作提供程序 } from './vscode/action'
import {
  genFunc,
  genFuncBody,
  genFuncPrompt,
  genFuncPromptBody,
  genMethod,
  genMethodPrompt,
  helloWrold,
} from './vscode/command'
import { 初始化事件监听 } from './vscode/event'
import { 侧边栏视图提供者 } from './vscode/web-view'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log(`${全局变量.插件名称}: 插件开始运行`)

  全局变量.扩展目录 = context.extensionUri

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.helloWorld`, helloWrold))

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genFunc`, genFunc))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genFuncPrompt`, genFuncPrompt))

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genFuncBody`, genFuncBody))
  context.subscriptions.push(
    vscode.commands.registerCommand(`${全局变量.插件名称}.genFuncPromptBody`, genFuncPromptBody),
  )

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genMethod`, genMethod))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genMethodPrompt`, genMethodPrompt))
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('typescript', new 自定义代码动作提供程序(), {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }),
  )
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(侧边栏视图提供者.视图id, 侧边栏视图提供者.获得实例()),
  )

  await 初始化事件监听()
}

export function deactivate(): void {}
