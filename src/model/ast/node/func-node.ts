import ts from 'typescript'
import { 获得所有相关类型, 获得类型名称, 解析引用类型名称 } from '../node-type/node-type.js'
import { 获得所有函数节点 } from '../source-file/source-file.js'
import { 函数节点 } from '../types/types.js'
import { 获得节点范围 } from './node.js'

export function 获得函数体相关类型(函数节点: 函数节点, 类型检查器: ts.TypeChecker): ts.Type[] {
  const 类型集合: Set<ts.Type> = new Set()

  function 递归提取类型(node: ts.Node): void {
    if (ts.isIdentifier(node)) {
      const 类型 = 类型检查器.getTypeAtLocation(node)
      类型集合.add(类型)
    }
    if (ts.isVariableDeclaration(node) && node.type) {
      类型集合.add(类型检查器.getTypeAtLocation(node.type))
    }
    if (ts.isParameter(node) && node.type) {
      类型集合.add(类型检查器.getTypeAtLocation(node.type))
    }
    if (ts.isPropertyDeclaration(node) && node.type) {
      类型集合.add(类型检查器.getTypeAtLocation(node.type))
    }
    if (ts.isReturnStatement(node) && node.expression) {
      类型集合.add(类型检查器.getTypeAtLocation(node.expression))
    }
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((declaration) => {
        if (declaration.type) {
          类型集合.add(类型检查器.getTypeAtLocation(declaration.type))
        }
        递归提取类型(declaration)
      })
    }

    ts.forEachChild(node, 递归提取类型)
  }

  if (函数节点.body) 递归提取类型(函数节点.body)

  return Array.from(类型集合)
    .flatMap((a) => 获得所有相关类型(a, 类型检查器))
    .filter((v, i, arr) => arr.findIndex((a) => a.symbol == v.symbol) == i)
}

export function 通过名称获得函数节点(源文件: ts.SourceFile, 函数名: string): 函数节点 | null {
  const 所有函数节点 = 获得所有函数节点(源文件)
  const 函数节点 = 所有函数节点[函数名]
  return 函数节点 || null
}

export function 通过完整位置获得函数节点(源文件: ts.SourceFile, 开始位置: number, 结束位置: number): 函数节点 | null {
  const 所有函数节点 = 获得所有函数节点(源文件)
  for (const 节点 of Object.values(所有函数节点)) {
    const 范围 = 获得节点范围(节点)
    if (范围.start <= 开始位置 && 结束位置 <= 范围.end) {
      return 节点
    }
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

export function 获得函数实际签名(函数节点: 函数节点, 类型检查器: ts.TypeChecker): string {
  const 函数类型 = 类型检查器.getTypeAtLocation(函数节点)
  return 类型检查器.typeToString(函数类型)
}

export function 获得函数形式签名(函数节点: 函数节点, 类型检查器: ts.TypeChecker, 包含前缀: boolean = true): string {
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

  const 前缀 = 是否导出 ? (是否默认导出 ? 'export default function ' : 'export function ') : 'function '

  return `${包含前缀 ? 前缀 : ''}${函数名称}${泛型参数}(${参数签名}): ${返回类型签名}`
}

export function 获得函数完整字符串(函数节点: 函数节点): string {
  return 函数节点.getText()
}
