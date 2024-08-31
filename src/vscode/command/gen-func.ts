import ts from 'typescript'
import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import {
  获得函数体相关类型,
  获得函数名称,
  获得函数完整字符串,
  获得函数实际签名,
  获得函数形式签名,
  获得函数节点类型,
  通过名称获得函数节点,
} from '../../model/ast/node/func-node'
import { 获得节点jsdoc结果 } from '../../model/ast/node/node'
import { 获得类型定义位置, 获得类型实现, 获得类型节点类型, 通过名称获得类型节点 } from '../../model/ast/node/type-node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../../model/ast/program'
import { 获得文件外部引用 } from '../../model/ast/source-file'
import { 获得所有相关类型, 获得类型名称, 获得类型所在文件, 获得类型的节点 } from '../../model/ast/type'
import { 函数节点, 类型节点 } from '../../model/ast/types/types'
import { 压缩为一行, 获得tsconfig文件路径, 获得types文件夹路径, 转换为相对项目根目录路径 } from '../../tools/tools'

export type 类型基础信息 = {
  内部名称: string | null
  类型说明: string | null
  类型名称: string
  类型位置: string
  类型实现: string
}
export type 类型信息 = 类型基础信息 & {
  相关类型: 类型信息[]
  相关函数: 函数信息[]
}
export type 函数基础信息 = {
  内部名称: string | null
  函数说明: string | null
  函数名称: string
  函数形式签名: string
  函数实际签名: string
  函数实现: string
}
export type 函数信息 = 函数基础信息 & {
  相关类型: 类型信息[]
  相关函数: 函数信息[]
}

export function 计算引用(
  程序: ts.Program,
  类型检查器: ts.TypeChecker,
  引用: { 内部名称: string | null; 定义名称: string; 位置: string }[],
  已处理的类型节点: 类型节点[] = [],
  已处理的函数节点: 函数节点[] = [],
): { 相关类型: 类型信息[]; 相关函数: 函数信息[] } {
  var 类型结果: { 内部名称: string | null; 节点: 类型节点 }[] = []
  var 函数结果: { 内部名称: string | null; 节点: 函数节点 }[] = []

  for (var 引用项 of 引用) {
    const 源文件 = 按路径选择源文件(引用项.位置, 程序)
    if (!源文件) continue

    const 类型节点 = 通过名称获得类型节点(源文件, 引用项.定义名称)
    if (类型节点) 类型结果.push({ 内部名称: 引用项.内部名称, 节点: 类型节点 })

    const 函数节点 = 通过名称获得函数节点(源文件, 引用项.定义名称)
    if (函数节点) 函数结果.push({ 内部名称: 引用项.内部名称, 节点: 函数节点 })
  }

  var 相关类型 = 类型结果
    .map((a) => 处理类型节点(程序, 类型检查器, a.节点, a.内部名称, 已处理的类型节点, 已处理的函数节点))
    .filter((a) => a != null)
  var 相关函数 = 函数结果
    .map((a) => 处理函数节点(程序, 类型检查器, a.节点, a.内部名称, 已处理的类型节点, 已处理的函数节点))
    .filter((a) => a != null)

  return { 相关类型, 相关函数 }
}
export function 处理类型节点(
  程序: ts.Program,
  类型检查器: ts.TypeChecker,
  节点: 类型节点,
  内部名称: string | null = null,
  已处理的类型节点: 类型节点[] = [],
  已处理的函数节点: 函数节点[] = [],
): 类型信息 | null {
  if (已处理的类型节点.includes(节点)) return null
  已处理的类型节点.push(节点)

  const jsdoc = 获得节点jsdoc结果(节点, 类型检查器)
  const 类型说明 = jsdoc?.评论文本 || null
  const 类型名称 = 获得类型名称(获得类型节点类型(节点, 类型检查器), 类型检查器)
  const 类型位置 = 获得类型定义位置(节点)
  const 类型实现 = 获得类型实现(节点, 类型检查器)

  const 相关类型: 类型信息[] = []
  const 相关函数: 函数信息[] = []
  if (jsdoc) {
    var jsdoc结果 = 计算引用(程序, 类型检查器, jsdoc.引用, 已处理的类型节点, 已处理的函数节点)
    相关类型.push(...jsdoc结果.相关类型)
    相关函数.push(...jsdoc结果.相关函数)
  }

  return { 内部名称, 类型说明, 类型名称, 类型位置, 类型实现, 相关类型, 相关函数 }
}
export function 处理函数节点(
  程序: ts.Program,
  类型检查器: ts.TypeChecker,
  节点: 函数节点,
  内部名称: string | null = null,
  已处理的类型节点: 类型节点[] = [],
  已处理的函数节点: 函数节点[] = [],
): 函数信息 | null {
  if (已处理的函数节点.includes(节点)) return null
  已处理的函数节点.push(节点)

  const 函数名称 = 获得函数名称(节点)
  const jsdoc = 获得节点jsdoc结果(节点, 类型检查器)
  const 函数说明 = jsdoc?.评论文本 || null
  const 函数形式签名 = 获得函数形式签名(节点, 类型检查器)
  const 函数实际签名 = 获得函数实际签名(节点, 类型检查器)
  const 函数实现 = 获得函数完整字符串(节点)

  const 相关类型信息 = 获得所有相关类型(获得函数节点类型(节点, 类型检查器), 类型检查器)
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
    var jsdoc结果 = 计算引用(程序, 类型检查器, jsdoc.引用, 已处理的类型节点, 已处理的函数节点)
    相关类型.push(...jsdoc结果.相关类型)
    相关函数.push(...jsdoc结果.相关函数)
  }

  return { 函数名称, 内部名称, 函数形式签名, 函数实际签名, 函数说明, 函数实现, 相关类型, 相关函数 }
}

export function 铺平引用结果(
  相关类型: 类型信息[],
  相关函数: 函数信息[],
): { 类型: 类型基础信息[]; 函数: 函数基础信息[] } {
  if (相关类型.length == 0 && 相关函数.length == 0) return { 类型: [], 函数: [] }

  var 本层类型: 类型基础信息[] = []
  var 本层函数: 函数基础信息[] = []

  var 累计类型: 类型信息[] = []
  var 累计函数: 函数信息[] = []

  for (var a of 相关类型) {
    本层类型.push(a)
    累计类型.push(...a.相关类型)
    累计函数.push(...a.相关函数)
  }
  for (var b of 相关函数) {
    本层函数.push(b)
    累计类型.push(...b.相关类型)
    累计函数.push(...b.相关函数)
  }

  var 子结果 = 铺平引用结果(累计类型, 累计函数)

  return { 类型: [...本层类型, ...子结果.类型], 函数: [...本层函数, ...子结果.函数] }
}

export async function 计算函数提示词(
  文件路径: string,
  函数名: string,
  要求: string | null,
  包含实现: boolean,
): Promise<string> {
  const tsconfig文件路径 = await 获得tsconfig文件路径()
  const types文件夹路径 = await 获得types文件夹路径()
  if (!tsconfig文件路径) {
    void vscode.window.showInformationMessage('没有找到tsconfig文件')
    throw new Error('没有找到tsconfig文件')
  }
  if (!types文件夹路径) {
    void vscode.window.showInformationMessage('没有找到types文件夹路径')
    throw new Error('没有找到types文件夹路径')
  }
  var 存在的tsconfig文件路径 = tsconfig文件路径

  const 程序 = 创建程序(存在的tsconfig文件路径, types文件夹路径)
  const 类型检查器 = 获得类型检查器(程序)

  const 源文件 = 按路径选择源文件(文件路径, 程序)
  if (!源文件) {
    void vscode.window.showInformationMessage('无法找到源文件')
    throw new Error('无法找到源文件')
  }

  const 函数节点 = 通过名称获得函数节点(源文件, 函数名)
  if (!函数节点) {
    void vscode.window.showInformationMessage('无法找到函数')
    throw new Error('无法找到函数')
  }

  const 解析结果 = 处理函数节点(程序, 类型检查器, 函数节点)
  if (!解析结果) {
    void vscode.window.showInformationMessage('解析函数失败')
    throw new Error('解析函数失败')
  }

  const 引用结果 = 铺平引用结果(解析结果.相关类型, 解析结果.相关函数)

  if (包含实现) {
    const 函数体结果 = 获得函数体相关类型(函数节点, 类型检查器)
      .map((a) => 获得类型的节点(a))
      .filter((a) => a != null)
      .map((a) => 处理类型节点(程序, 类型检查器, a))
      .filter((a) => a != null)
    引用结果.类型.push(...函数体结果)
    引用结果.类型 = Array.from(new Set(引用结果.类型))
  }

  const 头引入 = 获得文件外部引用(源文件, 类型检查器)

  const 提示词 = [
    '在typescript中, 我有一个函数.',
    要求 ? `请: ${要求}.` : 包含实现 ? '请帮我优化它.' : '请帮我实现它.',

    '',

    ...函数通用提示词(存在的tsconfig文件路径, 解析结果, 引用结果, 头引入, 包含实现),

    '',

    '只需要编写这个函数, 不需要写其他的函数, 不要在函数前后加注释, 不要引入其他文件.',
    全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
  ]
    .filter((a) => a != null)
    .join('\n')

  console.log('===========')
  console.log(提示词)

  return 提示词
}

export function 函数通用提示词(
  存在的tsconfig文件路径: string,
  解析结果: 函数信息,
  引用结果: { 类型: 类型基础信息[]; 函数: 函数基础信息[] },
  头引入: { 路径: string; 名称: string }[],
  包含实现: boolean,
): (string | null)[] {
  return [
    解析结果.函数说明 ? `它的说明是: ${压缩为一行(解析结果.函数说明)}` : null,
    `它的类型是: (主要考虑形式签名)`,
    `- 形式签名: ${解析结果.函数形式签名}`,
    `- 实际类型: ${解析结果.函数实际签名}`,
    包含实现 ? `现在的实现是(可能是错的): ${压缩为一行(解析结果.函数实现)}` : null,

    引用结果.类型.length != 0 ? '' : null,
    引用结果.类型.length != 0 ? '其中相关的类型有:' : null,
    ...引用结果.类型.flatMap((a) => [
      `- ${a.内部名称 || a.类型名称}:`,
      `  - 定义位置: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.类型位置)}`,
      a.类型说明 ? `  - 它的说明是: ${压缩为一行(a.类型说明)}` : null,
      `  - 它的实现是: ${压缩为一行(a.类型实现)}`,
    ]),

    引用结果.函数.length != 0 ? '' : null,
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

    头引入.length != 0 ? '' : null,
    头引入.length != 0 ? `另外, 还可以使用这些模块: (不需要引入)` : null,
    ...头引入.map((a) => `  - 来自: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.路径)} 的 ${a.名称} 模块`),
  ]
}
