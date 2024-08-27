import ts from 'typescript'
import { 获得所有函数节点 } from '../source-file.js'
import { 是函数类型, 获得类型名称 } from '../type.js'
import { 函数节点, 节点 } from '../types/types.js'
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

export function 获得函数实际签名(函数节点: 函数节点, 类型检查器: ts.TypeChecker): string {
  const 函数类型 = 类型检查器.getTypeAtLocation(函数节点)
  return 类型检查器.typeToString(函数类型)
}

/**
 * 可以使用 {@link 解析引用类型名称}
 */
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

/**
 * 获得函数在文件中的开始位置和结束位置
 */
export function 获得函数区域(函数节点: 函数节点): { start: number; end: number } {
  const 开始位置 = 函数节点.getStart()
  const 结束位置 = 函数节点.getEnd()
  return { start: 开始位置, end: 结束位置 }
}

export function 获得函数完整字符串(函数节点: 函数节点): string {
  return 函数节点.getText()
}

export function 是函数节点(a: 节点): a is 函数节点 {
  if (ts.isFunctionDeclaration(a) || ts.isMethodDeclaration(a)) {
    return true
  }
  return false
}
