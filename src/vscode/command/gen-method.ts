import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import { 通过位置获得类节点 } from '../../model/ast/node/class-node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../../model/ast/program'
import { 获得文件外部引用 } from '../../model/ast/source-file'
import { 获得tsconfig文件路径, 获得types文件夹路径 } from '../../tools/tools'
import { 类通用提示词, 计算类信息 } from './get-class'

export async function 计算类方法提示词(
  文件路径: string,
  开始位置: number,
  方法名: string,
  要求: string | null,
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

  var 类节点 = 通过位置获得类节点(源文件, 开始位置)
  if (!类节点) {
    void vscode.window.showInformationMessage('无法找到类节点')
    throw new Error('无法找到类节点')
  }

  var { 类说明, 类完整定义, 引用结果 } = 计算类信息(类节点, 类型检查器, 程序)
  const 头引入 = 获得文件外部引用(源文件, 类型检查器)

  var 提示词 = [
    `在typescript中, 我有一个类.`,
    `对于其中的'${方法名}', ${要求 ? `请: ${要求}` : '请帮我优化它'}.`,

    '',

    ...类通用提示词(存在的tsconfig文件路径, 类说明, 类完整定义, 引用结果, 头引入),

    '',

    '只需要编写这个方法, 不要编写类的其他部分',
    全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
  ]
    .filter((a) => a != null)
    .join('\n')

  console.log('===========')
  console.log(提示词)

  return 提示词
}
