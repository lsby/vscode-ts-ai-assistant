import path from 'path'
import * as vscode from 'vscode'
import { 类型信息 } from '../model/ast-new/type'

export async function 获得tsconfig文件路径(): Promise<string | null> {
  var files: vscode.Uri[] = await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**', 1)

  var 文件 = files[0]
  if (文件) {
    return 文件.fsPath
  }

  return null
}

export async function 获得node_modules文件夹路径(): Promise<string | null> {
  var 工作区 = vscode.workspace.workspaceFolders?.[0]
  if (工作区) {
    var nodeModules路径 = path.resolve(工作区.uri.fsPath, 'node_modules')
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
  var 正则表达式 = /(?:public|private|protected|static)?\s*([^()\s]+)\s*\(/u
  var 匹配结果 = 输入字符串.match(正则表达式)
  return 匹配结果 ? 匹配结果[1]?.trim() || null : null
}

export function 匹配类名(输入字符串: string): string | null {
  // 第一步：用正则匹配类定义部分
  const 初步匹配 = 输入字符串.match(/class\s+(\S+)/)
  if (!初步匹配) return null

  // 第二步：提取类名，只考虑空格前的部分
  const 类名部分 = 初步匹配[1]
  const 真实类名 = 类名部分?.split(' ')[0]?.split('<')[0]?.trim()

  return 真实类名 || null
}

export function 压缩为一行(a: string): string {
  return a.replaceAll('\r', '').replaceAll('\n', '\\n')
}

export function 转换为相对项目根目录路径(tsconfig文件路径: string, 路径: string): string {
  return path.relative(tsconfig文件路径, 路径)
}

export function 基本信息提示词(
  存在的tsconfig文件路径: string,
  文件路径: string,
  jsdoc文本: string | null,
  实现: string,
): (string | null)[] {
  return [
    `它在文件 ${转换为相对项目根目录路径(存在的tsconfig文件路径, 文件路径)} 中`,

    jsdoc文本 ? `它的说明是: ${压缩为一行(jsdoc文本)}` : null,
    `现在的实现是(可能是错的): ${压缩为一行(实现)}`,
  ]
}

export function 类型提示词(存在的tsconfig文件路径: string, 相关类型: 类型信息[]): (string | null)[] {
  return [
    相关类型.length != 0 ? '' : null,
    相关类型.length != 0 ? '其中相关的类型有:' : null,
    ...相关类型.flatMap((a) => [
      `- (${压缩为一行(a.节点名称)}):`,
      `  - 位置: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.位置)}`,
      `  - 它的实现是: ${压缩为一行(a.实现)}`,
    ]),
  ]
}

export function 头引入提示词(
  存在的tsconfig文件路径: string,
  头引入: { 路径: string; 名称: string }[],
): (string | null)[] {
  return [
    头引入.length != 0 ? '' : null,
    头引入.length != 0 ? `另外, 还可以使用这些模块: (不需要引入)` : null,
    ...头引入.map((a) => `  - 来自: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.路径)} 的 ${a.名称} 模块`),
  ]
}
