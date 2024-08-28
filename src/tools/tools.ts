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
export function 匹配函数名(a: string): string | null {
  return a.match(/function (.*?)[<\(]/)?.[1] || null
}

export function 匹配类方法(输入字符串: string): string | null {
  var 确保不是函数 = 匹配函数名(输入字符串)
  if (确保不是函数 != null) return null
  const 正则表达式 = /\s+(.*?)\s*\(/u
  const 匹配结果 = 输入字符串.match(正则表达式)
  return 匹配结果 ? 匹配结果[1] || null : null
}

export function 匹配类(输入字符串: string): string | null {
  const 正则表达式 = /class\s+(.*?)\s*{/
  const 匹配结果 = 输入字符串.match(正则表达式)
  return 匹配结果 ? 匹配结果[1] || null : null
}

export function 压缩为一行(a: string): string {
  return a.replaceAll('\n', '\\n')
}

export function 转换为相对项目根目录路径(tsconfig文件路径: string, 路径: string): string {
  return path.relative(tsconfig文件路径, 路径)
}
