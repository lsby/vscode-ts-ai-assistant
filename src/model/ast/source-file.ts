import ts from 'typescript'
import { 是函数类型 } from './type'
import { 函数节点, 类型节点 } from './types/types'

export function 获得源文件们(a: ts.Program): readonly ts.SourceFile[] {
  const 源文件们 = a.getSourceFiles()
  return 源文件们
}
export function 是dts文件(源文件: ts.SourceFile): boolean {
  return 源文件.isDeclarationFile
}
export function 获得文件路径(a: ts.SourceFile): string {
  return a.fileName
}
export function 获得全部文本(a: ts.SourceFile): string {
  return a.getFullText()
}
/**
 * 获得源文件中定义在顶层的节点们
 */
export function 获得所有顶层节点(a: ts.SourceFile): Array<ts.Node> {
  const 顶层节点数组: Array<ts.Node> = []
  a.forEachChild((节点) => {
    if (ts.isStatement(节点)) {
      顶层节点数组.push(节点)
    }
  })
  return 顶层节点数组
}

/**
 * 可以使用 {@link 获得所有顶层节点}
 * 可以使用 {@link 是函数类型}
 * 其中Recode的key是函数名
 */
export function 获得所有函数节点(源文件: ts.SourceFile, 类型检查器: ts.TypeChecker): Record<string, 函数节点> {
  const 所有节点 = 获得所有顶层节点(源文件)
  const 函数节点记录: Record<string, 函数节点> = {}

  所有节点.forEach((节点) => {
    const 类型 = 类型检查器.getTypeAtLocation(节点)
    if (是函数类型(类型, 类型检查器)) {
      if (ts.isFunctionDeclaration(节点) && 节点.name) {
        函数节点记录[节点.name.getText()] = 节点
      }
    }
  })

  return 函数节点记录
}

/**
 * 可以使用 {@link 获得所有顶层节点}
 * 其中Recode的key是类型名称
 */
export function 获得所有类型节点(源文件: ts.SourceFile): Record<string, 类型节点> {
  const 顶层节点 = 获得所有顶层节点(源文件)
  const 类型节点: Record<string, 类型节点> = {}

  for (const 节点 of 顶层节点) {
    if (ts.isTypeAliasDeclaration(节点) || ts.isInterfaceDeclaration(节点)) {
      类型节点[节点.name.getText()] = 节点
    }
  }

  return 类型节点
}
