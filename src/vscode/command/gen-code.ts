import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import * as ast from '../../model/ast-new/program'
import { 基本信息提示词, 头引入提示词, 类型提示词, 获得tsconfig文件路径, 获得types文件夹路径 } from '../../tools/tools'

export async function 计算优化代码片段提示词(
  文件路径: string,
  开始位置: number,
  结束位置: number,
  要求: string | null,
): Promise<string> {
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

  var 节点 = 程序.按范围查找节点(文件路径, { start: 开始位置, end: 结束位置 })
  var 函数节点 = 节点?.转换为函数节点()
  var 类节点 = 节点?.转换为类节点()

  if (函数节点) {
    var jsdoc文本 = 函数节点.获得JsDoc完整文本()
    var 实现 = 函数节点.获得节点全文()
    var 相关类型 = 函数节点.递归计算相关类型信息({ 解析函数体内部: 全局变量.配置.parseBody })
    var 头引入 = 程序.获得文件引入信息(文件路径)
    var 函数范围 = 函数节点.获得节点范围()

    var 函数头到选择头 = 开始位置 - 函数范围.start
    var 选择长度 = 结束位置 - 开始位置
    var 选择尾 = 函数头到选择头 + 选择长度
    实现 = `${实现.slice(0, 函数头到选择头)}<|从这里开始|>${实现.slice(函数头到选择头, 函数头到选择头 + 选择长度)}<|到这里结束|>${实现.slice(选择尾)}`

    var 提示词 = [
      '在typescript中, 我有一个函数.',

      '',
      ...基本信息提示词(存在的tsconfig文件路径, 文件路径, jsdoc文本, 实现),
      '',
      `对于其中我标记的部分, ${要求 ? `请: ${要求}` : '请帮我优化'}.`,
      ...类型提示词(存在的tsconfig文件路径, 相关类型),
      ...头引入提示词(存在的tsconfig文件路径, 头引入),

      '',
      '请只写出优化后的我标记的部分, 不要写出整个函数.',

      全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
    ]
      .filter((a) => a != null)
      .join('\n')

    console.log('===========')
    console.log(提示词)

    return 提示词
  }

  if (类节点) {
    var jsdoc文本 = 类节点.获得JsDoc完整文本()
    var 实现 = 类节点.获得节点全文()
    var 相关类型 = 类节点.递归计算相关类型信息({ 解析函数体内部: 全局变量.配置.parseBody })
    var 头引入 = 程序.获得文件引入信息(文件路径)
    var 类范围 = 类节点.获得节点范围()

    var 类头到选择头 = 开始位置 - 类范围.start
    var 选择长度 = 结束位置 - 开始位置
    var 选择尾 = 类头到选择头 + 选择长度
    实现 = `${实现.slice(0, 类头到选择头)}<|从这里开始|>${实现.slice(类头到选择头, 类头到选择头 + 选择长度)}<|到这里结束|>${实现.slice(选择尾)}`

    var 提示词 = [
      '在typescript中, 我有一个类.',

      '',
      ...基本信息提示词(存在的tsconfig文件路径, 文件路径, jsdoc文本, 实现),
      '',
      `对于其中我标记的部分, ${要求 ? `请: ${要求}` : '请帮我优化'}.`,
      ...类型提示词(存在的tsconfig文件路径, 相关类型),
      ...头引入提示词(存在的tsconfig文件路径, 头引入),

      '',
      '请只写出优化后的我标记的部分, 不要写出整个类.',

      全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
    ]
      .filter((a) => a != null)
      .join('\n')

    console.log('===========')
    console.log(提示词)

    return 提示词
  }

  void vscode.window.showInformationMessage('选中的部分不在函数或类里')
  throw new Error('选中的部分不在函数或类里')
}
