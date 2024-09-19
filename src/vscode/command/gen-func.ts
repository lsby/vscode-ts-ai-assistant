import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import * as ast from '../../model/ast-new/program'
import { 类型信息 } from '../../model/ast-new/type'
import { 压缩为一行, 获得tsconfig文件路径, 获得types文件夹路径, 转换为相对项目根目录路径 } from '../../tools/tools'

export async function 计算函数提示词(文件路径: string, 函数名: string, 要求: string | null): Promise<string> {
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

  const 函数节点 = 程序.按名称查找函数节点(函数名)
  if (!函数节点) {
    void vscode.window.showInformationMessage('无法找到函数')
    throw new Error('无法找到函数')
  }

  const jsdoc文本 = 函数节点.获得JsDoc完整文本()
  const 定义 = 函数节点.获得节点全文()
  const 相关类型 = 函数节点.递归获得相关类型()
  const 头引入 = 程序.获得文件引入信息(文件路径)

  const 提示词 = [
    '在typescript中, 我有一个函数.',
    要求 ? `请: ${要求}.` : '请帮我优化它.',

    '',

    ...函数通用提示词(存在的tsconfig文件路径, jsdoc文本, 定义, 相关类型, 头引入),

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
  jsdoc文本: string | null,
  定义: string,
  相关类型: 类型信息[],
  头引入: { 路径: string; 名称: string }[],
): (string | null)[] {
  return [
    jsdoc文本 ? `它的说明是: ${压缩为一行(jsdoc文本)}` : null,
    `现在的实现是(可能是错的): ${压缩为一行(定义)}`,

    相关类型.length != 0 ? '' : null,
    相关类型.length != 0 ? '其中相关的类型有:' : null,
    ...相关类型.flatMap((a) => [
      `- (${a.节点名称}):`,
      `  - 定义位置: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.定义位置)}`,
      `  - 它的实现是: ${压缩为一行(a.类型定义)}`,
    ]),

    头引入.length != 0 ? '' : null,
    头引入.length != 0 ? `另外, 还可以使用这些模块: (不需要引入)` : null,
    ...头引入.map((a) => `  - 来自: ${转换为相对项目根目录路径(存在的tsconfig文件路径, a.路径)} 的 ${a.名称} 模块`),
  ]
}
