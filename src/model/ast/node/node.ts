import ts from 'typescript'
import { 按路径选择源文件 } from '../program'
import { 节点 } from '../types/types'
import { 通过名称获得函数节点 } from './func-node'

export type jsdoc结果 = {
  评论文本: string
  引用的函数: { 内部名称: string; 函数名称: string; 函数位置: string }[]
}

/**
 * 分析一个节点的jsdoc部分
 * 获得其中的评论和评论中引用的函数(暂不支持解析引用的类型)
 * 其中:
 * - 内部名称: 指的是在jsdoc中实际写的名称
 * - 函数名称: 指的是引用的函数实际的名称
 * - 函数位置: 指的是定义这个函数的文件的完整路径
 */
export function 获得节点jsdoc说明(函数节点: 节点, 类型检查器: ts.TypeChecker): jsdoc结果 | null {
  var jsdoc = ts.getJSDocCommentsAndTags(函数节点)
  var 评论们 = jsdoc[0]?.comment
  if (jsdoc.length == 0 || 评论们 == null) return null

  var 文本结果 = ''
  var 引用: { 内部名称: string; 函数名称: string; 函数位置: string }[] = []

  if (typeof 评论们 == 'string') {
    文本结果 = 评论们
  } else {
    for (var 评论 of 评论们) {
      if (评论.kind == ts.SyntaxKind.JSDocText) {
        文本结果 += 评论.text
        continue
      }
      if (ts.isJSDocLink(评论)) {
        if (评论.name == null) continue

        var 字符串表示 = 评论.getText()
        var 导入的符号名称: string | null = null
        var 导入的符号位置: string | null = null

        var 提及内容 = 类型检查器.getSymbolAtLocation(评论.name)
        var 声明 = 提及内容?.getDeclarations()?.[0]
        if (声明 && ts.isImportSpecifier(声明)) {
          var 目标符号 = 类型检查器.getSymbolAtLocation(声明.parent.parent.parent.moduleSpecifier)
          if (目标符号) {
            导入的符号名称 = 声明.propertyName?.text || 声明.name.text || null
            var 文件路径 = 目标符号.getDeclarations()?.[0]?.getSourceFile().fileName
            if (文件路径 == null) return null
            导入的符号位置 = 文件路径
          }
        } else if (声明 && ts.isFunctionDeclaration(声明)) {
          导入的符号名称 = 声明.name?.getText() || null
          导入的符号位置 = 声明.getSourceFile().fileName
        }

        if (导入的符号名称 && 导入的符号位置) {
          var 重复检查 = 引用.find((a) => {
            return a.内部名称 == 字符串表示 && a.函数名称 == 导入的符号名称 && a.函数位置 == 导入的符号位置
          })
          if (!重复检查) {
            引用.push({ 内部名称: 字符串表示, 函数名称: 导入的符号名称, 函数位置: 导入的符号位置 })
          }
        }
        文本结果 += 字符串表示

        continue
      }
    }
  }

  return { 评论文本: 文本结果, 引用的函数: 引用 }
}

/**
 * 从输入 {@link jsdoc结果} 开始
 * 递归分析相关的函数引用
 * 将所有相关的函数和对应的内部名称组成数组返回
 * 需要注意处理循环引用造成的无限循环问题
 * 通过 {@link 获得节点jsdoc说明} 可以获得函数的jsdoc部分
 * 通过 {@link 按路径选择源文件} 可以由给定路径获得源文件
 * 通过 {@link 通过名称获得函数节点} 可以从源文件查找给定名称的函数
 */
export function 从jsdoc结果分析所有关联的函数(
  程序: ts.Program,
  类型检查器: ts.TypeChecker,
  jsdoc: jsdoc结果,
): Array<{ 内部名称: string; 函数: 节点 }> {
  const 结果: Array<{ 内部名称: string; 函数: 节点 }> = []
  const 已处理函数: Set<string> = new Set()

  for (const 引用的函数 of jsdoc.引用的函数) {
    const { 内部名称, 函数名称 } = 引用的函数

    if (已处理函数.has(函数名称)) {
      continue
    }

    const 源文件 = 按路径选择源文件(引用的函数.函数位置, 程序)
    if (源文件) {
      const 被引用函数节点 = 通过名称获得函数节点(源文件, 类型检查器, 函数名称)
      if (被引用函数节点) {
        已处理函数.add(函数名称)
        结果.push({ 内部名称, 函数: 被引用函数节点 })
        const 内部结果 = 获得节点jsdoc关联的所有函数(程序, 被引用函数节点, 类型检查器)
        结果.push(...内部结果)
      }
    }
  }

  return 结果
}

export function 获得节点jsdoc关联的所有函数(
  程序: ts.Program,
  节点: 节点,
  类型检查器: ts.TypeChecker,
): Array<{ 内部名称: string; 函数: 节点 }> {
  const jsdoc = 获得节点jsdoc说明(节点, 类型检查器)
  if (!jsdoc) return []
  return 从jsdoc结果分析所有关联的函数(程序, 类型检查器, jsdoc)
}
