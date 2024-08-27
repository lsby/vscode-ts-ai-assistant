import ts from 'typescript'
import { 获得所有函数节点 } from '../source-file.js'
import { 是函数类型, 获得类型名称 } from '../type.js'
import { 函数节点 } from '../types/types.js'
import { 按路径选择源文件 } from './../program.js'
import { 解析引用类型名称 } from './../type.js'

/**
 * 可以使用 {@link 获得所有函数节点}
 */
export function 通过名称获得函数节点(
  源文件: ts.SourceFile,
  类型检查器: ts.TypeChecker,
  函数名: string,
): 函数节点 | null {
  const 所有函数节点 = 获得所有函数节点(源文件, 类型检查器)
  const 函数节点 = 所有函数节点[函数名]

  if (函数节点 && 是函数类型(类型检查器.getTypeAtLocation(函数节点), 类型检查器)) {
    if (ts.isFunctionDeclaration(函数节点)) return 函数节点
  }
  return null
}

export function 获得函数节点类型(函数节点: 函数节点, 类型检查器: ts.TypeChecker): ts.Type {
  const 类型 = 类型检查器.getTypeAtLocation(函数节点)
  return 类型
}

export function 获得函数名称(函数节点: 函数节点): string {
  const 函数名称 = 函数节点.name ? 函数节点.name.getText() : '匿名函数'
  return 函数名称
}

export function 获得函数实际签名(函数节点: ts.FunctionDeclaration, 类型检查器: ts.TypeChecker): string {
  const 函数类型 = 类型检查器.getTypeAtLocation(函数节点)
  return 类型检查器.typeToString(函数类型)
}

/**
 * 可以使用 {@link 解析引用类型名称}
 */
export function 获得函数形式签名(函数节点: 函数节点, 类型检查器: ts.TypeChecker): string {
  const 函数名称 = 函数节点.name ? 函数节点.name.getText() : '匿名函数'
  const 签名 = 类型检查器.getSignatureFromDeclaration(函数节点)
  const 参数签名 = 签名
    ?.getParameters()
    .map((参数) => {
      var 参数名称 = 参数.getName()
      if (参数.valueDeclaration && ts.isParameter(参数.valueDeclaration) && 参数.valueDeclaration.type) {
        var 参数类型 = 参数.valueDeclaration.type
        if (ts.isTypeReferenceNode(参数类型)) {
          return `${参数名称}: ${解析引用类型名称(参数类型, 类型检查器)}`
        }
      }
      return `${参数名称}: ${获得类型名称(类型检查器.getTypeOfSymbol(参数), 类型检查器)}`
    })
    .join(', ')
  const 返回类型签名 = ((): string => {
    if (签名) {
      if (签名.declaration && 签名.declaration.type && ts.isTypeReferenceNode(签名.declaration.type)) {
        var 声明 = 签名.declaration.type
        return 解析引用类型名称(声明, 类型检查器)
      }
      return 获得类型名称(类型检查器.getReturnTypeOfSignature(签名), 类型检查器)
    }
    return 'void'
  })()

  const 泛型参数 = 函数节点.typeParameters
    ? `<${函数节点.typeParameters.map((类型参数) => 类型参数.getText()).join(', ')}> `
    : ''

  const 是否导出 = ts.getModifiers(函数节点)?.some((修饰符) => 修饰符.kind === ts.SyntaxKind.ExportKeyword) || false
  const 是否默认导出 =
    ts.getModifiers(函数节点)?.some((修饰符) => 修饰符.kind === ts.SyntaxKind.DefaultKeyword) || false

  const 前缀 = 是否导出 ? (是否默认导出 ? 'export default function' : 'export function') : 'function'

  return `${前缀} ${函数名称}${泛型参数}(${参数签名}): ${返回类型签名}`
}

/**
 * 分析一个函数的jsdoc部分
 * 获得其中的评论和评论中引用的函数(暂不支持解析引用的类型)
 * 其中:
 * - 内部名称: 指的是在jsdoc中实际写的名称
 * - 函数名称: 指的是引用的函数实际的名称
 * - 函数位置: 指的是定义这个函数的文件的完整路径
 */
export function 获得函数jsdoc说明(
  函数节点: 函数节点,
  类型检查器: ts.TypeChecker,
): {
  评论文本: string
  引用的函数: { 内部名称: string; 函数名称: string; 函数位置: string }[]
} | null {
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
 * 从输入函数开始
 * 递归分析相关函数的引用
 * 将所有相关的函数和对应的内部名称组成数组返回
 * 需要注意处理循环引用造成的无限循环问题
 * 通过 {@link 获得函数jsdoc说明} 可以获得函数的jsdoc部分
 * 通过 {@link 按路径选择源文件} 可以由给定路径获得源文件
 * 通过 {@link 通过名称获得函数节点} 可以从源文件查找给定名称的函数
 */
export function 获得函数jsdoc关联的所有函数(
  程序: ts.Program,
  函数节点: ts.FunctionDeclaration,
  类型检查器: ts.TypeChecker,
): Array<{ 内部名称: string; 函数: ts.FunctionDeclaration }> {
  const 结果: Array<{ 内部名称: string; 函数: ts.FunctionDeclaration }> = []
  const 已处理函数: Set<string> = new Set()
  const 函数jsdoc = 获得函数jsdoc说明(函数节点, 类型检查器)

  if (函数jsdoc) {
    for (const 引用的函数 of 函数jsdoc.引用的函数) {
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
          const 内部结果 = 获得函数jsdoc关联的所有函数(程序, 被引用函数节点, 类型检查器)
          结果.push(...内部结果)
        }
      }
    }
  }

  return 结果
}

/**
 * 获得函数在文件中的开始位置和结束位置
 */
export function 获得函数区域(函数节点: ts.FunctionDeclaration): { start: number; end: number } {
  const 开始位置 = 函数节点.getStart()
  const 结束位置 = 函数节点.getEnd()
  return { start: 开始位置, end: 结束位置 }
}

export function 获得函数完整字符串(函数节点: ts.FunctionDeclaration): string {
  return 函数节点.getText()
}
