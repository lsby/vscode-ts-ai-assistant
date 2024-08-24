import path from 'path'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import * as vscode from 'vscode'
import { 全局变量 } from './global/global'
import { 我的OpenAI } from './model/openai'
import { 项目管理器 } from './model/project'
import { 获得tsconfig文件路径, 获得函数名 } from './tools/tools'
import { 自定义代码动作提供程序 } from './vscode/action'
import { genCode, genPrompt, helloWrold } from './vscode/command'
import { 侧边栏视图提供者 } from './vscode/web-view'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log(`${全局变量.插件名称}: 插件开始运行`)

  全局变量.扩展目录 = context.extensionUri

  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.helloWorld`, helloWrold))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genCode`, genCode))
  context.subscriptions.push(vscode.commands.registerCommand(`${全局变量.插件名称}.genPrompt`, genPrompt))
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('typescript', new 自定义代码动作提供程序(), {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }),
  )
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(侧边栏视图提供者.视图id, 侧边栏视图提供者.获得实例()),
  )

  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.setEvent(async (message) => {
    switch (message.command) {
      case '调用AI':
        var 提示词: ChatCompletionMessageParam[] = message.data.map((a) => ({
          role: a.角色 == '用户' ? 'user' : 'assistant',
          content: a.内容,
        }))
        提示词.unshift({ role: 'system', content: 全局变量.配置.systemPrompt })

        await new 我的OpenAI({
          apiKey: 全局变量.配置.apiKey,
          baseUrl: path.join(全局变量.配置.baseUrl, 'v1'),
        })
          .chat({
            model: 全局变量.配置.modelName,
            messages: 提示词,
            async cb(data: string) {
              await 侧边栏实例.postMessage({ command: 'AI结果字符', data })
              await new Promise((res, _req) => setTimeout(() => res(null), 0.7))
            },
          })
          .catch(async (e) => {
            await 侧边栏实例.postMessage({ command: 'AI调用结束' })
            void vscode.window.showInformationMessage(String(e))
          })
        await 侧边栏实例.postMessage({ command: 'AI调用结束' })
        return
      case '应用到代码': {
        if (!message.data) {
          void vscode.window.showInformationMessage('没有找到ts代码')
          throw new Error('没有找到ts代码')
        }

        var editor = vscode.window.activeTextEditor
        if (!editor) {
          void vscode.window.showInformationMessage('没有活动的编辑器')
          throw new Error('没有活动的编辑器')
        }

        var document = editor.document

        var tsconfig文件路径 = await 获得tsconfig文件路径()
        if (!tsconfig文件路径) {
          void vscode.window.showInformationMessage('没有找到tsconfig文件')
          throw new Error('没有找到tsconfig文件')
        }

        var 存在的tsconfig文件路径 = tsconfig文件路径
        var 项目: 项目管理器 = new 项目管理器(tsconfig文件路径)

        await 项目.初始化()

        var 相对文件路径 = path.relative(存在的tsconfig文件路径, document.uri.fsPath)
        var 函数名 = 获得函数名(document.lineAt(editor.selection.active.line).text)
        if (!函数名) {
          void vscode.window.showInformationMessage('无法解析函数名')
          throw new Error('无法解析函数名')
        }

        var 结果 = 项目.获得函数信息(相对文件路径, 函数名)
        if (!结果) {
          void vscode.window.showInformationMessage('无法找到函数定义')
          throw new Error('无法找到函数定义')
        }

        var start = 结果.函数文件内位置.start
        var end = 结果.函数文件内位置.end

        var range = new vscode.Range(document.positionAt(start), document.positionAt(end))
        var newText = message.data

        await editor.edit((editBuilder) => {
          editBuilder.replace(range, newText)
        })

        await vscode.commands.executeCommand('workbench.action.files.save')

        return
      }
    }

    var _类型检查: never = message
  })
}

export function deactivate(): void {}
