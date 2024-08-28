import path from 'path'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { 获得类节点方法范围, 通过位置获得类节点, 通过名称获得类节点 } from '../model/ast/node/class-node'
import { 通过名称获得函数节点 } from '../model/ast/node/func-node'
import { 获得节点范围 } from '../model/ast/node/node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../model/ast/program'
import { 我的OpenAI } from '../model/openai'
import { 匹配函数名, 匹配类, 匹配类方法, 获得tsconfig文件路径 } from '../tools/tools'
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
        var 起点行 = document.lineAt(editor.selection.active.line).text

        var 函数名 = 匹配函数名(起点行)
        if (函数名) {
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

          var { start, end } = 获得节点范围(函数节点)
          var range = new vscode.Range(document.positionAt(start), document.positionAt(end))
          var newText = message.data

          await editor.edit((editBuilder) => {
            editBuilder.replace(range, newText)
          })

          await vscode.commands.executeCommand('workbench.action.files.save')
        }

        var 类方法名 = 匹配类方法(起点行)
        if (类方法名) {
          const tsconfig文件路径 = await 获得tsconfig文件路径()
          if (!tsconfig文件路径) {
            void vscode.window.showInformationMessage('没有找到tsconfig文件')
            throw new Error('没有找到tsconfig文件')
          }

          const 程序 = 创建程序(tsconfig文件路径)
          const 源文件 = 按路径选择源文件(文件路径, 程序)
          if (!源文件) {
            void vscode.window.showInformationMessage('无法找到源文件')
            throw new Error('无法找到源文件')
          }

          var 零点偏移 = document.offsetAt(editor.selection.start)
          var 类节点 = 通过位置获得类节点(源文件, 零点偏移)
          if (!类节点) {
            void vscode.window.showInformationMessage('无法找到类节点')
            throw new Error('无法找到类节点')
          }

          var 范围 = 获得类节点方法范围(类节点, 类方法名, 源文件)
          if (!范围) {
            void vscode.window.showInformationMessage('无法找到类方法')
            throw new Error('无法找到类方法')
          }

          var { start, end } = 范围
          var range = new vscode.Range(document.positionAt(start), document.positionAt(end))
          var newText = message.data

          await editor.edit((editBuilder) => {
            editBuilder.replace(range, newText)
          })

          await vscode.commands.executeCommand('workbench.action.files.save')
        }

        var 类名 = 匹配类(起点行)
        if (类名) {
          const tsconfig文件路径 = await 获得tsconfig文件路径()
          if (!tsconfig文件路径) {
            void vscode.window.showInformationMessage('没有找到tsconfig文件')
            throw new Error('没有找到tsconfig文件')
          }

          const 程序 = 创建程序(tsconfig文件路径)
          const 源文件 = 按路径选择源文件(文件路径, 程序)
          if (!源文件) {
            void vscode.window.showInformationMessage('无法找到源文件')
            throw new Error('无法找到源文件')
          }

          var 类节点 = 通过名称获得类节点(源文件, 类名)
          if (!类节点) {
            void vscode.window.showInformationMessage('无法找到类节点')
            throw new Error('无法找到类节点')
          }

          var 类范围 = 获得节点范围(类节点, 源文件)
          var { start, end } = 类范围
          var range = new vscode.Range(document.positionAt(start), document.positionAt(end))
          var newText = message.data

          await editor.edit((editBuilder) => {
            editBuilder.replace(range, newText)
          })

          await vscode.commands.executeCommand('workbench.action.files.save')
        }

        return
      }
    }

    var _类型检查: never = message
  })
}
