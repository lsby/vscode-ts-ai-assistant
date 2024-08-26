import path from 'path'
import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { 函数信息, 函数分析结果, 类型信息, 类型引用, 项目管理器 } from '../model/project'
import { 获得tsconfig文件路径 } from '../tools/tools'
import { 侧边栏视图提供者 } from './web-view'

export async function helloWrold(): Promise<void> {
  void vscode.window.showInformationMessage(`Hello World!`)
}
async function 计算提示词(函数名: string, 文件路径: string, 带body: boolean): Promise<string> {
  var tsconfig文件路径 = await 获得tsconfig文件路径()
  if (!tsconfig文件路径) {
    void vscode.window.showInformationMessage('没有找到tsconfig文件')
    throw new Error('没有找到tsconfig文件')
  }

  var 存在的tsconfig文件路径 = tsconfig文件路径
  var 项目: 项目管理器 = new 项目管理器(tsconfig文件路径)

  await 项目.初始化()

  var 相对文件路径 = path.relative(存在的tsconfig文件路径, 文件路径)
  var 结果 = await 项目.分析函数(相对文件路径, 函数名)

  if (结果 == null) {
    void vscode.window.showInformationMessage('无法找到函数定义')
    throw new Error('无法找到函数定义')
  }

  var 非空结果 = 结果

  var 过滤字面类型 = (a: 函数信息): 类型引用[] =>
    a.函数类型引用.filter((a) => a.字面类型 && a.字面类型 != a.类型完整名称)
  var 过滤类型引用 = (a: 函数信息): 类型引用[] => a.函数类型引用.filter((a) => !a.字面类型 && a.类型位置)
  var 过滤类型信息 = (a: 函数分析结果): 类型信息[] => a.引用类型信息.filter((a) => a.类型位置)

  var 提示词 = [
    '我想写一个typescript的函数, 请帮我实现它',
    结果.函数jsdoc文本 ? `函数的说明是:` : null,
    结果.函数jsdoc文本 ? `- ${结果.函数jsdoc文本.replaceAll('\n', '\\n')}` : null,
    结果.引用函数信息.length != 0
      ? `其中提及到的函数已经实现和导入了, 请勿重复编写这些函数, 不需要任何操作就可以直接使用这些函数, 它们是:`
      : null,
    ...结果.引用函数信息.flatMap((a) => [
      `- ${a.函数名称}:`,
      a.函数jsdoc文本 ? `  - 它的说明是: ${a.函数jsdoc文本.replaceAll('\n', '\\n')}` : null,
      `  - 它的形式是: ${a.函数签名}`,
      过滤字面类型(a).length != 0 ? `  - 其中的已知类型是:` : null,
      ...过滤字面类型(a).map((a) => `    - ${a.字面类型} 是 ${a.类型完整名称}`),
      过滤类型引用(a).length != 0 ? `  - 其中的其他类型是:` : null,
      ...过滤类型引用(a).map((a) => `    - 在 ${a.类型位置} 定义的 ${a.类型外层名称}`),
    ]),
    `函数的形式是:`,
    `- ${结果.函数签名}`,
    过滤字面类型(非空结果).length != 0 ? `其中的已知类型是:` : null,
    ...过滤字面类型(非空结果).map((a) => `- ${a.字面类型} 是 ${a.类型完整名称}`),
    过滤类型引用(非空结果).length != 0 ? `其中的其他类型是:` : null,
    ...过滤类型引用(非空结果).map((a) => `- 在 ${a.类型位置} 定义的 ${a.类型外层名称}`),
    过滤类型信息(非空结果).length != 0 ? `这些类型的实现是:` : null,
    ...过滤类型信息(非空结果).map(
      (a) => `- 在 ${a.类型位置} 定义的 ${a.类型名称}: ${a.类型实现.replaceAll('\n', '\\n')}`,
    ),
    结果.函数实现 && 带body ? '这个函数目前的实现是(可能是错误的):' : null,
    结果.函数实现 && 带body ? 结果.函数实现.replaceAll('\n', '\\n') : null,
    '',
    '请不要在函数头或尾加注释, 不要写其他的函数, 只能编写这一个函数.',
    全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
  ]
    .filter((a) => a != null)
    .join('\n')

  // console.log('===========')
  // console.log(提示词)

  return 提示词
}
export async function genCode(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算提示词(函数名, 文件路径, false)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genPrompt(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算提示词(函数名, 文件路径, false)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}
export async function genCodeBody(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算提示词(函数名, 文件路径, true)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genPromptBody(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算提示词(函数名, 文件路径, true)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}
