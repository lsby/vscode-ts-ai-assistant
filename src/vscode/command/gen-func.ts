import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import * as ast from '../../model/ast-new/program'
import { 基本信息提示词, 头引入提示词, 类型提示词, 获得tsconfig文件路径, 获得types文件夹路径 } from '../../tools/tools'

export async function 计算函数提示词(文件路径: string, 函数名: string, 要求: string | null): Promise<string> {
  var tsconfig文件路径 = await 获得tsconfig文件路径()
  var types文件夹路径 = await 获得types文件夹路径()
  if (!tsconfig文件路径) {
    void vscode.window.showInformationMessage('没有找到tsconfig文件')
    throw new Error('没有找到tsconfig文件')
  }
  if (!types文件夹路径) {
    void vscode.window.showInformationMessage('没有找到types文件夹路径')
    throw new Error('没有找到types文件夹路径')
  }
  var 存在的tsconfig文件路径 = tsconfig文件路径

  var 程序 = ast.程序.创建程序(存在的tsconfig文件路径, types文件夹路径)

  var 函数节点 = 程序.按名称查找函数节点(函数名)
  if (!函数节点) {
    void vscode.window.showInformationMessage('无法找到函数')
    throw new Error('无法找到函数')
  }

  var jsdoc文本 = 函数节点.获得JsDoc完整文本()
  var 实现 = 函数节点.获得节点全文()
  var 相关类型 = 函数节点.递归计算相关类型信息({ 解析函数体内部: 全局变量.配置.parseBody })
  var 头引入 = 程序.获得文件引入信息(文件路径)

  var 提示词 = [
    '在typescript中, 我有一个函数.',

    '',
    ...基本信息提示词(存在的tsconfig文件路径, 文件路径, jsdoc文本, 实现),
    '',
    要求 ? `请: ${要求}.` : '请帮我优化.',
    ...类型提示词(存在的tsconfig文件路径, 相关类型),
    ...头引入提示词(存在的tsconfig文件路径, 头引入),

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
