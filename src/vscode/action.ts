import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { 匹配函数名, 匹配类, 匹配类方法名称 } from '../tools/tools'

export class 自定义代码动作提供程序 implements vscode.CodeActionProvider {
  public provideCodeActions(
    文档: vscode.TextDocument,
    范围: vscode.Range,
    _上下文: vscode.CodeActionContext,
    _取消标记: vscode.CancellationToken,
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    var 代码动作: vscode.CodeAction[] = []

    var 编辑器 = vscode.window.activeTextEditor
    var 文件路径 = 编辑器?.document.uri.fsPath
    if (!文件路径) return 代码动作

    var 起点行 = 文档.lineAt(范围.start.line).text

    var 函数名 = 匹配函数名(起点行)
    if (函数名) {
      var 生成函数 = new vscode.CodeAction('生成函数', vscode.CodeActionKind.QuickFix)
      生成函数.command = {
        command: `${全局变量.插件名称}.genFunc`,
        title: '生成函数',
        arguments: [函数名, 文件路径],
      }
      代码动作.push(生成函数)

      var 生成生成函数提示词 = new vscode.CodeAction('生成生成函数提示词', vscode.CodeActionKind.QuickFix)
      生成生成函数提示词.command = {
        command: `${全局变量.插件名称}.genFuncPrompt`,
        title: '生成生成函数提示词',
        arguments: [函数名, 文件路径],
      }
      代码动作.push(生成生成函数提示词)

      var 优化函数 = new vscode.CodeAction('优化函数', vscode.CodeActionKind.QuickFix)
      优化函数.command = {
        command: `${全局变量.插件名称}.genFuncBody`,
        title: '优化函数',
        arguments: [函数名, 文件路径],
      }
      代码动作.push(优化函数)

      var 生成优化函数提示词 = new vscode.CodeAction('生成优化函数提示词', vscode.CodeActionKind.QuickFix)
      生成优化函数提示词.command = {
        command: `${全局变量.插件名称}.genFuncPromptBody`,
        title: '生成优化函数提示词',
        arguments: [函数名, 文件路径],
      }
      代码动作.push(生成优化函数提示词)
    }

    var 类方法名 = 匹配类方法名称(起点行)
    if (类方法名) {
      var 零点偏移 = 文档.offsetAt(范围.start)

      var 优化方法 = new vscode.CodeAction('优化方法', vscode.CodeActionKind.QuickFix)
      优化方法.command = {
        command: `${全局变量.插件名称}.genMethod`,
        title: '优化方法',
        arguments: [零点偏移, 类方法名, 文件路径],
      }
      代码动作.push(优化方法)

      var 生成优化方法提示词 = new vscode.CodeAction('生成优化方法提示词', vscode.CodeActionKind.QuickFix)
      生成优化方法提示词.command = {
        command: `${全局变量.插件名称}.genMethodPrompt`,
        title: '生成优化方法提示词',
        arguments: [零点偏移, 类方法名, 文件路径],
      }
      代码动作.push(生成优化方法提示词)
    }

    var 类名 = 匹配类(起点行)
    if (类名) {
      var 优化类 = new vscode.CodeAction('优化类', vscode.CodeActionKind.QuickFix)
      优化类.command = {
        command: `${全局变量.插件名称}.genClass`,
        title: '优化类',
        arguments: [类名, 文件路径],
      }
      代码动作.push(优化类)

      var 生成优化类提示词 = new vscode.CodeAction('生成优化类提示词', vscode.CodeActionKind.QuickFix)
      生成优化类提示词.command = {
        command: `${全局变量.插件名称}.genClassPrompt`,
        title: '生成优化类提示词',
        arguments: [类名, 文件路径],
      }
      代码动作.push(生成优化类提示词)
    }

    return 代码动作
  }
}
