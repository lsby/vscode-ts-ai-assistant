import * as vscode from 'vscode'
import { 全局变量 } from '../../global/global'
import { 通过完整位置获得类节点 } from '../../model/ast/node/class-node'
import { 通过完整位置获得函数节点 } from '../../model/ast/node/func-node'
import { 获得节点范围 } from '../../model/ast/node/node'
import { 创建程序, 按路径选择源文件, 获得类型检查器 } from '../../model/ast/program'
import { 获得文件外部引用 } from '../../model/ast/source-file'
import { 获得tsconfig文件路径, 获得types文件夹路径 } from '../../tools/tools'
import { 函数通用提示词, 处理函数节点, 铺平引用结果 } from './gen-func'
import { 类通用提示词, 计算类信息 } from './get-class'

export async function 计算优化代码片段提示词(
  文件路径: string,
  开始位置: number,
  结束位置: number,
  要求: string | null,
  提问模式: boolean,
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

  const 头引入 = 获得文件外部引用(源文件, 类型检查器)

  var 函数节点 = 通过完整位置获得函数节点(源文件, 开始位置, 结束位置)
  if (函数节点) {
    const 解析结果 = 处理函数节点(程序, 类型检查器, 函数节点)
    if (解析结果) {
      const 引用结果 = 铺平引用结果(解析结果.相关类型, 解析结果.相关函数)

      var 函数范围 = 获得节点范围(函数节点)
      var 函数头到选择头 = 开始位置 - 函数范围.start
      var 选择长度 = 结束位置 - 开始位置
      var 选择尾 = 函数头到选择头 + 选择长度
      解析结果.函数实现 = `${解析结果.函数实现.slice(0, 函数头到选择头)}<|从这里开始|>${解析结果.函数实现.slice(函数头到选择头, 函数头到选择头 + 选择长度)}<|到这里结束|>${解析结果.函数实现.slice(选择尾)}`

      var 提示词 = [
        '在typescript中, 我有一个函数.',
        `对于其中我标记的部分, ${提问模式 ? `请给我讲讲${要求 ? `: ${要求}` : ''}` : `${要求 ? `请: ${要求}.` : '请帮我优化.'}`}`,

        '',

        ...函数通用提示词(存在的tsconfig文件路径, 解析结果, 引用结果, 头引入, true),

        '',

        提问模式 ? null : '请只写出优化后的我标记的部分, 不要写出整个函数.',
        全局变量.配置.otherPrompt ? 全局变量.配置.otherPrompt : null,
      ]
        .filter((a) => a != null)
        .join('\n')

      console.log('===========')
      console.log(提示词)

      return 提示词
    }
  }

  var 类 = 通过完整位置获得类节点(源文件, 开始位置, 结束位置)
  if (类) {
    var { 类说明, 类完整定义, 引用结果 } = 计算类信息(类, 类型检查器, 程序)

    var 类范围 = 获得节点范围(类)
    var 类头到选择头 = 开始位置 - 类范围.start
    var 选择长度 = 结束位置 - 开始位置
    var 选择尾 = 类头到选择头 + 选择长度
    类完整定义 = `${类完整定义.slice(0, 类头到选择头)}<|从这里开始|>${类完整定义.slice(类头到选择头, 类头到选择头 + 选择长度)}<|到这里结束|>${类完整定义.slice(选择尾)}`

    var 提示词 = [
      '在typescript中, 我有一个类.',
      `对于其中我标记的部分, ${提问模式 ? `请给我讲讲${要求 ? `: ${要求}` : '细节'}` : `${要求 ? `请: ${要求}.` : '请帮我优化它.'}`}`,

      '',

      ...类通用提示词(存在的tsconfig文件路径, 类说明, 类完整定义, 引用结果, 头引入),

      '',

      提问模式 ? null : '请只写出优化后的我标记的部分, 不要写出整个函数.',
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
