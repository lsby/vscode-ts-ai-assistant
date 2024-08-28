import path from 'path'
import * as vscode from 'vscode'
import { 获得类节点完整定义, 获得类节点类型, 通过位置获得类节点 } from '../../model/ast/node/class-node'
import { 获得节点jsdoc结果 } from '../../model/ast/node/node'
import { 获得类型定义位置, 获得类型实现, 获得类型节点类型 } from '../../model/ast/node/type-node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../../model/ast/program'
import { 是dts文件, 获得所有类型节点, 获得源文件们 } from '../../model/ast/source-file'
import { 获得所有相关类型, 获得类型名称, 获得类型所在文件 } from '../../model/ast/type'
import { 压缩为一行, 获得tsconfig文件路径 } from '../../tools/tools'

export async function 计算类方法提示词(起始位置: number, 方法名: string, 文件路径: string): Promise<string> {
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
    `请你帮我实现或优化其中的'${方法名}'方法`,
    '只编写这个方法, 不要写类的其他部分',
  ]
    .filter((a) => a != null)
    .join('\n')

  return 提示词
}
