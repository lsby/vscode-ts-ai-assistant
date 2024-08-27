import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { 获得函数名 } from '../tools/tools'

export class 自定义代码动作提供程序 implements vscode.CodeActionProvider {
  public provideCodeActions(
    文档: vscode.TextDocument,
    范围: vscode.Range,
    _上下文: vscode.CodeActionContext,
    _取消标记: vscode.CancellationToken,
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    var 代码动作: vscode.CodeAction[] = []

    var 起点行 = 文档.lineAt(范围.start.line).text
    var 函数名 = 获得函数名(起点行)
    if (!函数名) return

    var 编辑器 = vscode.window.activeTextEditor
    var 文件路径 = 编辑器?.document.uri.fsPath
    if (!文件路径) return

    var 调用AI = new vscode.CodeAction('调用AI', vscode.CodeActionKind.QuickFix)
    调用AI.command = {
      command: `${全局变量.插件名称}.genCode`,
      title: '调用AI',
      arguments: [函数名, 文件路径],
    }
    代码动作.push(调用AI)

    var 仅生成提示词 = new vscode.CodeAction('仅生成提示词', vscode.CodeActionKind.QuickFix)
    仅生成提示词.command = {
      command: `${全局变量.插件名称}.genPrompt`,
      title: '仅生成提示词',
      arguments: [函数名, 文件路径],
    }
    代码动作.push(仅生成提示词)

    var 调用AI带实现 = new vscode.CodeAction('调用AI(带实现)', vscode.CodeActionKind.QuickFix)
    调用AI带实现.command = {
      command: `${全局变量.插件名称}.genCodeBody`,
      title: '调用AI(带实现)',
      arguments: [函数名, 文件路径],
    }
    代码动作.push(调用AI带实现)

    var 仅生成提示词带实现 = new vscode.CodeAction('仅生成提示词(带实现)', vscode.CodeActionKind.QuickFix)
    仅生成提示词带实现.command = {
      command: `${全局变量.插件名称}.genPromptBody`,
      title: '仅生成提示词(带实现)',
      arguments: [函数名, 文件路径],
    }
    代码动作.push(仅生成提示词带实现)

    return 代码动作
  }
}
