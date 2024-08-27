import path from 'path'
import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { 获得类节点完整定义, 获得类节点类型, 通过位置获得类节点 } from '../model/ast/node/class-node'
import {
  是函数节点,
  获得函数名称,
  获得函数完整字符串,
  获得函数实际签名,
  获得函数形式签名,
  获得函数节点类型,
  通过名称获得函数节点,
} from '../model/ast/node/func-node'
import {
  jsdoc结果,
  从jsdoc结果分析所有关联的函数,
  获得节点jsdoc关联的所有函数,
  获得节点jsdoc结果,
} from '../model/ast/node/node'
import { 获得类型定义位置, 获得类型实现, 获得类型节点类型 } from '../model/ast/node/type-node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../model/ast/program'
import { 是dts文件, 获得所有类型节点, 获得文件外部引用, 获得源文件们 } from '../model/ast/source-file'
import { 获得所有相关类型, 获得类型名称, 获得类型所在文件 } from '../model/ast/type'
import { 函数节点 } from '../model/ast/types/types'
import { 压缩为一行, 获得tsconfig文件路径 } from '../tools/tools'
import { 侧边栏视图提供者 } from './web-view'

export async function helloWrold(): Promise<void> {
  void vscode.window.showInformationMessage(`Hello World!`)
}

async function 计算函数提示词(函数名: string, 文件路径: string, 包含实现: boolean): Promise<string> {
  const tsconfig文件路径 = await 获得tsconfig文件路径()
  if (!tsconfig文件路径) {
    void vscode.window.showInformationMessage('没有找到tsconfig文件')
    throw new Error('没有找到tsconfig文件')
  }
  var 存在的tsconfig文件路径 = tsconfig文件路径

  const 程序 = 创建程序(存在的tsconfig文件路径)
  const 类型检查器 = 获得类型检查器(程序)
  const 所有源文件 = 获得源文件们(程序)

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

  const 所有类型 = 所有源文件
    .filter((a) => !是dts文件(a))
    .map((a) => 获得所有类型节点(a))
    .reduce((s, a) => Object.assign(s, a), {})
  const 所有类型信息 = Object.values(所有类型).map((a) => ({
    位置: 获得类型定义位置(a),
    实现: 获得类型实现(a, 类型检查器),
    名称: 获得类型名称(获得类型节点类型(a, 类型检查器), 类型检查器),
    jsdoc: 获得节点jsdoc结果(a, 类型检查器),
  }))

  type 处理后的函数类型 = {
    函数名称: string
    内部名称: string
    函数形式签名: string
    函数实际签名: string
    函数说明: string | undefined
    函数实现: string
    相交的类型信息: { 位置: string; 实现: string; 名称: string; jsdoc: jsdoc结果 | null }[]
    引用的函数: 处理后的函数类型[]
  }
  function 处理函数节点(函数: 函数节点, 内部名称: string = ''): 处理后的函数类型 {
    const 函数名称 = 获得函数名称(函数)
    const 函数形式签名 = 获得函数形式签名(函数, 类型检查器)
    const 函数实际签名 = 获得函数实际签名(函数, 类型检查器)
    const 函数说明 = 获得节点jsdoc结果(函数, 类型检查器)?.评论文本
    const 函数引用的函数 = 获得节点jsdoc关联的所有函数(程序, 函数, 类型检查器)
      .map((a) => {
        var 节点 = a.函数
        if (是函数节点(节点)) return 处理函数节点(节点, a.内部名称)
        return null
      })
      .filter((a) => a != null)
    const 函数实现 = 获得函数完整字符串(函数)
    const 函数类型 = 获得函数节点类型(函数, 类型检查器)
    const 相关类型 = 获得所有相关类型(函数类型, 类型检查器)

    const 相关类型信息 = 相关类型.map((a) => ({
      名称: 获得类型名称(a, 类型检查器),
      位置: 获得类型所在文件(a),
    }))

    const 相交的类型信息 = 所有类型信息
      .filter((a) => 相关类型信息.some((b) => a.位置 == b.位置 && a.名称 == b.名称))
      .map((a) => ({ ...a, 位置: path.relative(存在的tsconfig文件路径, a.位置) }))

    const 类型引用的函数 = 相交的类型信息
      .flatMap((类型) => (类型.jsdoc ? 从jsdoc结果分析所有关联的函数(程序, 类型检查器, 类型.jsdoc) : null))
      .filter((a) => a != null)
      .map((a) => {
        var 节点 = a.函数
        if (是函数节点(节点)) return 处理函数节点(节点, a.内部名称)
        return null
      })
      .filter((a) => a != null)

    const 引用的函数 = [...函数引用的函数, ...类型引用的函数]

    return { 函数名称, 内部名称, 函数形式签名, 函数实际签名, 函数说明, 函数实现, 相交的类型信息, 引用的函数 }
  }
  function 生成提示词片段(函数信息: 处理后的函数类型): string[] {
    return [
      `- ${函数信息.内部名称 || 函数信息.函数名称}:`,
      函数信息.函数说明 ? `  - 它的说明是: ${压缩为一行(函数信息.函数说明)}` : null,
      `  - 它的类型是: (主要考虑形式签名)`,
      `    - 形式签名: ${函数信息.函数形式签名}`,
      `    - 实际类型: ${函数信息.函数实际签名}`,
      函数信息.相交的类型信息.length != 0 ? `  - 其中的相关类型是:` : null,
      ...函数信息.相交的类型信息.flatMap((a) => [
        `    - 在 ${a.位置} 定义的 ${a.名称}:}`,
        a.jsdoc?.评论文本 ? `      - 说明: ${压缩为一行(a.jsdoc.评论文本)}` : null,
        `      - 实现: ${压缩为一行(a.实现)}`,
      ]),
    ].filter((a) => a != null)
  }

  const 输入函数信息 = 处理函数节点(函数节点)
  const 当前文件的引入信息 = 获得文件外部引用(源文件, 类型检查器).map((a) => ({
    ...a,
    路径: path.relative(存在的tsconfig文件路径, a.路径),
  }))
  const 提示词 = [
    '请帮我写一个typescript函数:',
    ...生成提示词片段(输入函数信息),
    包含实现 ? `  - 现在的实现是(可能是错的): ${压缩为一行(输入函数信息.函数实现)}` : null,
    当前文件的引入信息.length != 0 ? `  - 另外, 还可以使用这些模块: (不需要引入)` : null,
    当前文件的引入信息.length != 0 ? 当前文件的引入信息.map((a) => `    - 来自: ${a.路径} 的 ${a.名称} 模块`) : null,
    输入函数信息.引用的函数.length != 0
      ? `在说明中提及到的函数信息是: (这些函数已经实现和导入了, 可以直接使用, 请勿重复编写这些函数)`
      : null,
    ...输入函数信息.引用的函数.flatMap(生成提示词片段),
    '',
    '请只编写这一个函数, 不要在函数前后加注释或引入文件, 不要写其他的函数.',
    全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
  ]
    .filter((a) => a != null)
    .join('\n')

  console.log('===========')
  console.log(提示词)

  return 提示词
}
async function 计算类方法提示词(起始位置: number, 方法名: string, 文件路径: string): Promise<string> {
  const tsconfig文件路径 = await 获得tsconfig文件路径()
  if (!tsconfig文件路径) {
    void vscode.window.showInformationMessage('没有找到tsconfig文件')
    throw new Error('没有找到tsconfig文件')
  }
  var 存在的tsconfig文件路径 = tsconfig文件路径

  const 程序 = 创建程序(存在的tsconfig文件路径)
  const 类型检查器 = 获得类型检查器(程序)
  const 所有源文件 = 获得源文件们(程序)

  const 源文件 = 按路径选择源文件(文件路径, 程序)
  if (!源文件) {
    void vscode.window.showInformationMessage('无法找到源文件')
    throw new Error('无法找到源文件')
  }

  var 类节点 = 通过位置获得类节点(源文件, 起始位置)
  if (!类节点) {
    void vscode.window.showInformationMessage('无法找到类节点')
    throw new Error('无法找到类节点')
  }

  const 所有类型 = 所有源文件
    .filter((a) => !是dts文件(a))
    .map((a) => 获得所有类型节点(a))
    .reduce((s, a) => Object.assign(s, a), {})
  const 所有类型信息 = Object.values(所有类型).map((a) => ({
    位置: 获得类型定义位置(a),
    实现: 获得类型实现(a, 类型检查器),
    名称: 获得类型名称(获得类型节点类型(a, 类型检查器), 类型检查器),
    jsdoc: 获得节点jsdoc结果(a, 类型检查器),
  }))

  var 类节点完整定义 = 获得类节点完整定义(类节点)
  var 类类型 = 获得类节点类型(类节点, 类型检查器)
  var 相关类型 = 获得所有相关类型(类类型, 类型检查器)

  const 相关类型信息 = 相关类型.map((a) => ({
    名称: 获得类型名称(a, 类型检查器),
    位置: 获得类型所在文件(a),
  }))

  const 相交的类型信息 = 所有类型信息
    .filter((a) => 相关类型信息.some((b) => a.位置 == b.位置 && a.名称 == b.名称))
    .map((a) => ({ ...a, 位置: path.relative(存在的tsconfig文件路径, a.位置) }))

  var 提示词 = [
    `在typescript中, 我有一个类, 这是它的完整定义:`,
    `  - ${压缩为一行(类节点完整定义)}`,
    相交的类型信息.length != 0 ? `  - 其中的相关类型是:` : null,
    ...相交的类型信息.flatMap((a) => [
      `    - 在 ${a.位置} 定义的 ${a.名称}`,
      a.jsdoc?.评论文本 ? `      - 说明: ${压缩为一行(a.jsdoc.评论文本)}` : null,
      `      - 实现: ${压缩为一行(a.实现)}`,
    ]),
    '',
    `请你帮我实现其中的'${方法名}'方法`,
    '只编写这个方法就可以了, 不要写类的其他部分',
  ]
    .filter((a) => a != null)
    .join('\n')

  return 提示词
}

export async function genFunc(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(函数名, 文件路径, false)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genFuncPrompt(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(函数名, 文件路径, false)
  const 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genFuncBody(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(函数名, 文件路径, true)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genFuncPromptBody(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(函数名, 文件路径, true)
  const 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genMethod(起始位置: number, 方法名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算类方法提示词(起始位置, 方法名, 文件路径)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genMethodPrompt(起始位置: number, 方法名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算类方法提示词(起始位置, 方法名, 文件路径)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}
