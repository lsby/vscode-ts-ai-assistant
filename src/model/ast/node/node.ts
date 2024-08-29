import path from 'path'
import ts from 'typescript'
import { 按路径选择源文件 } from '../program'
import { 节点 } from '../types/types'
import { 通过名称获得函数节点 } from './func-node'
import { 通过名称获得类型节点 } from './type-node'

export type jsdoc结果 = {
  评论文本: string
  引用: { 内部名称: string; 定义名称: string; 位置: string }[]
}

export function 获得节点jsdoc结果(函数节点: 节点, 类型检查器: ts.TypeChecker): jsdoc结果 | null {
  var jsdoc = ts.getJSDocCommentsAndTags(函数节点)
  var 评论们 = jsdoc[0]?.comment
  if (jsdoc.length == 0 || 评论们 == null) return null

  var 文本结果 = ''
  var 引用: { 内部名称: string; 定义名称: string; 位置: string }[] = []

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
            导入的符号位置 = path.normalize(文件路径)
          }
        } else if (
          声明 &&
          (ts.isFunctionDeclaration(声明) ||
            ts.isTypeAliasDeclaration(声明) ||
            ts.isInterfaceDeclaration(声明) ||
            ts.isClassDeclaration(声明))
        ) {
          导入的符号名称 = 声明.name?.getText() || null
          导入的符号位置 = 声明.getSourceFile().fileName
        }

        if (导入的符号名称 && 导入的符号位置) {
          var 重复检查 = 引用.find((a) => {
            return a.内部名称 == 字符串表示 && a.定义名称 == 导入的符号名称 && a.位置 == 导入的符号位置
          })
          if (!重复检查) {
            引用.push({ 内部名称: 字符串表示, 定义名称: 导入的符号名称, 位置: path.normalize(导入的符号位置) })
          }
        }
        文本结果 += 字符串表示

        continue
      }
    }
  }

  return { 评论文本: 文本结果, 引用: 引用 }
}

export function 从jsdoc结果分析所有关联的节点(
  程序: ts.Program,
  类型检查器: ts.TypeChecker,
  jsdoc: jsdoc结果,
): Array<{ 内部名称: string; 节点: 节点 }> {
  const 结果: Array<{ 内部名称: string; 节点: 节点 }> = []
  const 已处理项: Set<string> = new Set()

  for (const 引用项 of jsdoc.引用) {
    const { 内部名称, 定义名称 } = 引用项

    if (已处理项.has(定义名称)) {
      continue
    }

    const 源文件 = 按路径选择源文件(引用项.位置, 程序)
    if (源文件) {
      const 函数节点 = 通过名称获得函数节点(源文件, 类型检查器, 定义名称)
      if (函数节点) {
        已处理项.add(定义名称)
        结果.push({ 内部名称, 节点: 函数节点 })
        const 内部结果 = 获得节点jsdoc关联的所有节点(程序, 函数节点, 类型检查器)
        结果.push(...内部结果)
      }

      const 类型节点 = 通过名称获得类型节点(源文件, 定义名称)
      if (类型节点) {
        已处理项.add(定义名称)
        结果.push({ 内部名称, 节点: 类型节点 })
        const 内部结果 = 获得节点jsdoc关联的所有节点(程序, 类型节点, 类型检查器)
        结果.push(...内部结果)
      }
    }
  }

  return 结果
}

export function 获得节点jsdoc关联的所有节点(
  程序: ts.Program,
  节点: 节点,
  类型检查器: ts.TypeChecker,
): Array<{ 内部名称: string; 节点: 节点 }> {
  const jsdoc = 获得节点jsdoc结果(节点, 类型检查器)
  if (!jsdoc) return []
  return 从jsdoc结果分析所有关联的节点(程序, 类型检查器, jsdoc)
}

export function 获得节点范围(节点: 节点, 源文件?: ts.SourceFile): { start: number; end: number } {
  return { start: 节点.getStart(源文件), end: 节点.getEnd() }
}
