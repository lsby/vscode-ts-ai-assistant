import path from 'path'
import * as vscode from 'vscode'

export async function 获得tsconfig文件路径(): Promise<string | null> {
  var files: vscode.Uri[] = await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**', 1)

  var 文件 = files[0]
  if (文件) {
    return 文件.fsPath
  }

  return null
}

export async function 获得node_modules文件夹路径(): Promise<string | null> {
  const 工作区 = vscode.workspace.workspaceFolders?.[0]
  if (工作区) {
    const nodeModules路径 = path.resolve(工作区.uri.fsPath, 'node_modules')
    return nodeModules路径
  }
  return null
}

export async function 获得types文件夹路径(): Promise<string | null> {
  var node_modules文件夹路径 = await 获得node_modules文件夹路径()
  if (node_modules文件夹路径 == null) return null
  return path.resolve(node_modules文件夹路径, '@types')
}

export function 匹配函数名(a: string): string | null {
  return a.match(/function (.*?)\s*[<\(]/)?.[1]?.trim() || null
}

export function 匹配类方法名(输入字符串: string): string | null {
  var 确保不是函数 = 匹配函数名(输入字符串)
  if (确保不是函数 != null) return null
  const 正则表达式 = /(?:public|private|protected|static)?\s*([^()\s]+)\s*\(/u
  const 匹配结果 = 输入字符串.match(正则表达式)
  return 匹配结果 ? 匹配结果[1]?.trim() || null : null
}

export function 匹配类名(输入字符串: string): string | null {
  const 匹配结果1 = 输入字符串.match(/class\s+(.*?)\s+(.*)\{/)
  if (匹配结果1) return 匹配结果1[1]?.trim() || null
  const 匹配结果2 = 输入字符串.match(/class\s+(.*?)\s*\{/)
  if (匹配结果2) return 匹配结果2[1]?.trim() || null
  return null
}

export function 路径在node_modules里(路径: string): boolean {
  const 分组的路径 = path.normalize(路径).split(path.sep)
  for (var i = 0; i < 分组的路径.length; i++) {
    if (分组的路径[i] == 'node_modules') {
      return true
    }
  }
  return false
}

export function 压缩为一行(a: string): string {
  return a.replaceAll('\n', '\\n')
}

export function 转换为相对项目根目录路径(tsconfig文件路径: string, 路径: string): string {
  return path.relative(tsconfig文件路径, 路径)
}
