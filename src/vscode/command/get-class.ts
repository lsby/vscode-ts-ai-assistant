import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import { 获得类节点完整定义, 获得类节点类型, 通过名称获得类节点 } from '../../model/ast/node/class-node'
import { 获得节点jsdoc结果 } from '../../model/ast/node/node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../../model/ast/program'
import { 获得文件外部引用 } from '../../model/ast/source-file'
import { 获得所有相关类型, 获得类型名称, 获得类型所在文件 } from '../../model/ast/type'
import { 压缩为一行, 获得tsconfig文件路径, 转换为相对项目根目录路径 } from '../../tools/tools'
import { 函数信息, 类型信息, 计算引用 } from './gen-func'

export async function 计算类提示词(类名: string, 文件路径: string, 要求: string): Promise<string> {
  const tsconfig文件路径 = await 获得tsconfig文件路径()
  if (!tsconfig文件路径) {
    void vscode.window.showInformationMessage('没有找到tsconfig文件')
    throw new Error('没有找到tsconfig文件')
  }
  var 存在的tsconfig文件路径 = tsconfig文件路径

  const 程序 = 创建程序(存在的tsconfig文件路径)
  const 类型检查器 = 获得类型检查器(程序)

  const 源文件 = 按路径选择源文件(文件路径, 程序)
  if (!源文件) {
    void vscode.window.showInformationMessage('无法找到源文件')
    throw new Error('无法找到源文件')
  }

  var 类节点 = 通过名称获得类节点(源文件, 类名)
  if (!类节点) {
    void vscode.window.showInformationMessage('无法找到类节点')
    throw new Error('无法找到类节点')
  }

  var 类完整定义 = 获得类节点完整定义(类节点)
  const jsdoc = 获得节点jsdoc结果(类节点, 类型检查器)
  const 类说明 = jsdoc?.评论文本 || null

  var 相关类型信息 = 获得所有相关类型(获得类节点类型(类节点, 类型检查器), 类型检查器)
    .map((a) => {
      var 位置 = 获得类型所在文件(a)
      if (位置 == null) return null
      return { 内部名称: null, 定义名称: 获得类型名称(a, 类型检查器), 位置: 位置 }
    })
    .filter((a) => a != null)
  var 相关引用 = 计算引用(程序, 类型检查器, 相关类型信息)

  const 相关类型: 类型信息[] = [...相关引用.相关类型]
  const 相关函数: 函数信息[] = [...相关引用.相关函数]
  if (jsdoc) {
    var jsdoc结果 = 计算引用(程序, 类型检查器, jsdoc.引用)
    相关类型.push(...jsdoc结果.相关类型)
    相关函数.push(...jsdoc结果.相关函数)
  }

  var 引用结果 = { 类型: 相关类型, 函数: 相关函数 }
  const 头引入 = 获得文件外部引用(源文件, 类型检查器)

  var 提示词 = [
    `在typescript中, 我有一个类.`,
    `请你: ${要求}.`,
    类说明 ? `- 它的说明是: ${压缩为一行(类说明)}` : null,
    `- 它的完整定义是:`,
    `  - ${压缩为一行(类完整定义)}`,

    引用结果.类型.length != 0 ? '其中相关的类型有:' : null,
    ...引用结果.类型.flatMap((a) => [
      `- ${a.内部名称 || a.类型名称}:`,
      `  - 定义位置: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.类型位置)}`,
      a.类型说明 ? `  - 它的说明是: ${压缩为一行(a.类型说明)}` : null,
      `  - 它的实现是: ${压缩为一行(a.类型实现)}`,
    ]),

    引用结果.函数.length != 0
      ? '其中相关的函数有: (这些函数已经实现和导入了, 可以直接使用, 请勿重复编写这些函数)'
      : null,
    ...引用结果.函数.flatMap((a) => [
      `- ${a.内部名称 || a.函数名称}:`,
      a.函数说明 ? `  - 它的说明是: ${压缩为一行(a.函数说明)}` : null,
      `  - 它的类型是:`,
      `    - 形式签名: ${a.函数形式签名}`,
      `    - 实际类型: ${a.函数实际签名}`,
    ]),

    头引入.length != 0 ? `另外, 还可以使用这些模块: (不需要引入)` : null,
    ...头引入.map((a) => `  - 来自: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.路径)} 的 ${a.名称} 模块`),

    '',

    '请写出优化后的类的完整定义.',
    全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
  ]
    .filter((a) => a != null)
    .join('\n')

  console.log('===========')
  console.log(提示词)

  return 提示词
}
