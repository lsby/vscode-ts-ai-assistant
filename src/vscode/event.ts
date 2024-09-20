import path from 'path'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import * as ast from '../model/ast-new/program'
import { 我的OpenAI } from '../model/openai'
import { 匹配函数名, 匹配类名, 匹配类方法名, 获得tsconfig文件路径, 获得types文件夹路径 } from '../tools/tools'
import { 侧边栏视图提供者 } from './web-view'

export async function 初始化事件监听(): Promise<void> {
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()

  var 我的openAI实例 = new 我的OpenAI({
    apiKey: 全局变量.配置.apiKey,
    baseUrl: path.join(全局变量.配置.baseUrl, 'v1'),
  })

  await 侧边栏实例.setEvent(async (message) => {
    switch (message.command) {
      case '调用AI':
        var 提示词: ChatCompletionMessageParam[] = message.data.map((a) => ({
          role: a.角色 == '用户' ? 'user' : 'assistant',
          content: a.内容,
        }))
        提示词.unshift({ role: 'system', content: 全局变量.配置.systemPrompt })

        await 我的openAI实例
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

        var 编辑器 = vscode.window.activeTextEditor
        if (!编辑器) {
          void vscode.window.showInformationMessage('没有活动的编辑器')
          throw new Error('没有活动的编辑器')
        }

        var document = 编辑器.document
        var 文件路径 = document.uri.fsPath
        var 开始位置 = document.offsetAt(编辑器.selection.start)
        var 结束位置 = document.offsetAt(编辑器.selection.end)
        var 起点行文本 = document.lineAt(编辑器.selection.active.line).text

        var tsconfig文件路径 = await 获得tsconfig文件路径()
        var types文件夹路径 = await 获得types文件夹路径()
        if (!tsconfig文件路径) {
          void vscode.window.showInformationMessage('没有找到tsconfig文件')
          throw new Error('没有找到tsconfig文件')
        }
        if (!types文件夹路径) {
          void vscode.window.showInformationMessage('没有找到types文件夹路径')
          throw new Error('没有找到types文件夹路径')
        }
        var 存在的tsconfig文件路径 = tsconfig文件路径

        if (开始位置 != 结束位置) {
          var range = new vscode.Range(document.positionAt(开始位置), document.positionAt(结束位置))
          var newText = message.data

          await 编辑器.edit((editBuilder) => {
            editBuilder.replace(range, newText)
          })

          await vscode.commands.executeCommand('workbench.action.files.save')
          return
        }

        var 程序 = ast.程序.创建程序(存在的tsconfig文件路径, types文件夹路径)

        var 函数名 = 匹配函数名(起点行文本)
        if (函数名) {
          var 函数节点 = 程序.按名称查找函数节点(函数名)
          if (!函数节点) {
            void vscode.window.showInformationMessage('无法找到函数')
            throw new Error('无法找到函数')
          }

          var { start, end } = 函数节点.获得节点范围()
          var range = new vscode.Range(document.positionAt(start), document.positionAt(end))
          var newText = message.data

          await 编辑器.edit((editBuilder) => {
            editBuilder.replace(range, newText)
          })

          await vscode.commands.executeCommand('workbench.action.files.save')
          return
        }

        var 类方法名 = 匹配类方法名(起点行文本)
        if (类方法名) {
          var 零点偏移 = document.offsetAt(编辑器.selection.start)
          var 可能的类节点 = 程序.按范围查找节点(文件路径, { start: 零点偏移, end: 零点偏移 })?.转换为类节点()
          if (!可能的类节点) {
            void vscode.window.showInformationMessage('无法找到类节点')
            throw new Error('无法找到类节点')
          }

          var 范围 = 可能的类节点.按方法名称获得方法范围(类方法名)
          if (!范围) {
            void vscode.window.showInformationMessage('无法找到类方法')
            throw new Error('无法找到类方法')
          }

          var { start, end } = 范围
          var range = new vscode.Range(document.positionAt(start), document.positionAt(end))
          var newText = message.data

          await 编辑器.edit((editBuilder) => {
            editBuilder.replace(range, newText)
          })

          await vscode.commands.executeCommand('workbench.action.files.save')
          return
        }

        var 类名 = 匹配类名(起点行文本)
        if (类名) {
          var 类节点 = 程序.按名称查找类节点(类名)
          if (!类节点) {
            void vscode.window.showInformationMessage('无法找到类节点')
            throw new Error('无法找到类节点')
          }

          var 类范围 = 类节点.获得节点范围()
          var { start, end } = 类范围
          var range = new vscode.Range(document.positionAt(start), document.positionAt(end))
          var newText = message.data

          await 编辑器.edit((editBuilder) => {
            editBuilder.replace(range, newText)
          })

          await vscode.commands.executeCommand('workbench.action.files.save')
          return
        }

        return
      }
      case '停止生成': {
        await 我的openAI实例.stop()
        await 侧边栏实例.postMessage({ command: 'AI调用结束' })
        return
      }
    }

    var _类型检查: never = message
  })
}
