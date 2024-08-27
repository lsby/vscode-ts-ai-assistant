import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { 匹配函数名, 匹配类方法 } from '../tools/tools'

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

      var 生成函数提示词 = new vscode.CodeAction('生成函数提示词', vscode.CodeActionKind.QuickFix)
      生成函数提示词.command = {
        command: `${全局变量.插件名称}.genFuncPrompt`,
        title: '生成函数提示词',
        arguments: [函数名, 文件路径],
      }
      代码动作.push(生成函数提示词)

      var 生成函数_参考实现 = new vscode.CodeAction('生成函数(参考实现)', vscode.CodeActionKind.QuickFix)
      生成函数_参考实现.command = {
        command: `${全局变量.插件名称}.genFuncBody`,
        title: '生成函数(参考实现)',
        arguments: [函数名, 文件路径],
      }
      代码动作.push(生成函数_参考实现)

      var 生成函数提示词_参考实现 = new vscode.CodeAction('生成函数提示词(参考实现)', vscode.CodeActionKind.QuickFix)
      生成函数提示词_参考实现.command = {
        command: `${全局变量.插件名称}.genFuncPromptBody`,
        title: '生成函数提示词(参考实现)',
        arguments: [函数名, 文件路径],
      }
      代码动作.push(生成函数提示词_参考实现)
    }

    var 类方法名 = 匹配类方法(起点行)
    if (类方法名) {
      var 零点偏移 = 文档.offsetAt(范围.start)

      var 生成方法 = new vscode.CodeAction('生成方法', vscode.CodeActionKind.QuickFix)
      生成方法.command = {
        command: `${全局变量.插件名称}.genMethod`,
        title: '生成方法',
        arguments: [零点偏移, 类方法名, 文件路径],
      }
      代码动作.push(生成方法)

      var 生成方法提示词 = new vscode.CodeAction('生成方法提示词', vscode.CodeActionKind.QuickFix)
      生成方法提示词.command = {
        command: `${全局变量.插件名称}.genMethodPrompt`,
        title: '生成方法提示词',
        arguments: [零点偏移, 类方法名, 文件路径],
      }
      代码动作.push(生成方法提示词)
    }

    return 代码动作
  }
}
