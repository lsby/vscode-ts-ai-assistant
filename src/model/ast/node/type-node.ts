import path from 'path'
import ts from 'typescript'
import { 类型节点 } from '../types/types'
import { 获得函数形式签名 } from './func-node.js'

/**
 * 计算给定类型节点的字符串表示
 * - 对于类型节点是类的情况, 需要依次解析它的 构造函数, 属性, 方法 等元素的类型, 凑出不含实现的类的定义
 *   - 对于属性, 直接getText即可
 *   - 对于构造函数, 它的参数可以直接由getText获得
 *   - 对于方法, 可以使用 {@link 获得函数形式签名} 获得其签名
 * - 对于类型节点是其他情况, 只需要getText即可
 */
export function 获得类型实现(类型节点: 类型节点, 类型检查器: ts.TypeChecker): string {
  if (ts.isClassDeclaration(类型节点)) {
    const 类名 = 类型节点.name ? 类型节点.name.text : ''
    const 构造函数 = 类型节点.members.find(ts.isConstructorDeclaration)
    const 属性 = 类型节点.members.filter(ts.isPropertyDeclaration)
    const 方法 = 类型节点.members.filter(ts.isMethodDeclaration)

    let 结果 = `class ${类名} {\n`

    if (构造函数) {
      const 参数 = 构造函数.parameters.map((param) => param.getText()).join(', ')
      结果 += `  constructor(${参数})\n`
    }

    属性.forEach((attr) => {
      结果 += `  ${attr.getText()}\n`
    })

    方法.forEach((method) => {
      结果 += `  ${获得函数形式签名(method, 类型检查器, false)}\n`
    })

    结果 += `}`
    return 结果
  } else {
    return 类型节点.getText()
  }
}

export function 获得类型定义位置(a: 类型节点): string {
  const 来源位置 = path.normalize(a.getSourceFile().fileName)
  return 来源位置
}

export function 获得类型节点类型(类型节点: ts.Node, 类型检查器: ts.TypeChecker): ts.Type {
  return 类型检查器.getTypeAtLocation(类型节点)
}
