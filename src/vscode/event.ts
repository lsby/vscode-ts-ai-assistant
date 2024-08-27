import path from 'path'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { 获得函数区域, 通过名称获得函数节点 } from '../model/ast/node/func-node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../model/ast/program'
import { 我的OpenAI } from '../model/openai'
import { 获得tsconfig文件路径, 获得函数名 } from '../tools/tools'
import { 侧边栏视图提供者 } from './web-view'

export async function 初始化事件监听(): Promise<void> {
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
        var 文件路径 = document.uri.fsPath
        var 函数名 = 获得函数名(document.lineAt(editor.selection.active.line).text)
        if (!函数名) {
          void vscode.window.showInformationMessage('无法解析函数名')
          throw new Error('无法解析函数名')
        }

        const tsconfig文件路径 = await 获得tsconfig文件路径()
        if (!tsconfig文件路径) {
          void vscode.window.showInformationMessage('没有找到tsconfig文件')
          throw new Error('没有找到tsconfig文件')
        }

        const 程序 = 创建程序(tsconfig文件路径)
        const 类型检查器 = 获得类型检查器(程序)

        const 源文件 = 按路径选择源文件(文件路径, 程序)
        if (!源文件) {
          void vscode.window.showInformationMessage('无法找到源文件')
          throw new Error('无法找到源文件')
        }

        const 函数节点 = 通过名称获得函数节点(源文件, 类型检查器, 函数名)
        if (!函数节点) {
          void vscode.window.showInformationMessage('无法找到函数')
          throw new Error('无法找到函数')
        }

        var { start, end } = 获得函数区域(函数节点)
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
