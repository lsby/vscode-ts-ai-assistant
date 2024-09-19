import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import * as ast from '../../model/ast-new/program'
import { 获得tsconfig文件路径, 获得types文件夹路径 } from '../../tools/tools'
import { 类通用提示词 } from './get-class'

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

  const 程序 = ast.程序.创建程序(存在的tsconfig文件路径, types文件夹路径)

  var 查询结果 = 程序.按范围查找节点(文件路径, { start: 开始位置, end: 开始位置 })
  var 类节点 = 查询结果?.转换为类节点()
  if (!类节点) {
    void vscode.window.showInformationMessage('无法找到类节点')
    throw new Error('无法找到类节点')
  }

  const jsdoc文本 = 类节点.获得JsDoc完整文本()
  const 定义 = 类节点.获得节点全文()
  const 相关类型 = 类节点.递归获得相关类型()
  const 头引入 = 程序.获得文件引入信息(文件路径)

  var 提示词 = [
    `在typescript中, 我有一个类.`,
    `对于其中的'${方法名}', ${要求 ? `请: ${要求}` : '请帮我优化它'}.`,

    '',

    ...类通用提示词(存在的tsconfig文件路径, jsdoc文本, 定义, 相关类型, 头引入),

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
