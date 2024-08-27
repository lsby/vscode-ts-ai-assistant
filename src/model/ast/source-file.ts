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
export function 获得源文件内容(a: ts.SourceFile): string {
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
    if (ts.isTypeAliasDeclaration(节点) || ts.isInterfaceDeclaration(节点) || ts.isClassDeclaration(节点)) {
      if (节点.name) 类型节点[节点.name.getText()] = 节点
    }
  }

  return 类型节点
}

/**
 * 查找当前文件的所有引入, 找到定义在node_modeule里的类型引入
 * 我们可以去获得引入的符号的声明的位置, 然后判断位置是否在node_modeule里
 */
export function 获得文件外部引用(源文件: ts.SourceFile, 类型检查器: ts.TypeChecker): { 路径: string; 名称: string }[] {
  const 引入数组: { 路径: string; 名称: string }[] = []
  const 引入声明 = 源文件.statements.filter(ts.isImportDeclaration)

  for (const 引入声明项 of 引入声明) {
    const 引入模块名称 = 引入声明项.moduleSpecifier.getText()
    const 引入符号 = 类型检查器.getSymbolAtLocation(引入声明项.moduleSpecifier)
    if (引入符号 && 引入符号.declarations && 引入符号.declarations[0]) {
      const 引入声明信息 = 类型检查器.getTypeOfSymbolAtLocation(引入符号, 引入符号.declarations[0])
      const 引入位置 = 引入声明信息.symbol.getDeclarations()?.[0]?.getSourceFile().fileName
      if (引入位置 && 引入位置.includes('node_modules')) {
        引入数组.push({ 路径: 引入位置, 名称: 引入模块名称 })
      }
    }
  }
  return 引入数组
}
