import * as vscode from 'vscode'

export async function 获得tsconfig文件路径(): Promise<string | null> {
  var files: vscode.Uri[] = await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**', 1)

  var 文件 = files[0]
  if (文件) {
    return 文件.fsPath
  }

  return null
}
export function 获得函数名(a: string): string | null {
  return a.match(/function (.*?)[<\(]/)?.[1] || null
}
