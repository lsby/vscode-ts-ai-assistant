import path from 'path'
import ts from 'typescript'
import { 类型节点, 节点 } from '../types/types'
import { 获得所有类型节点 } from './../source-file.js'
import { 获得函数形式签名 } from './func-node.js'

export function 通过名称获得类型节点(源文件: ts.SourceFile, 类型名: string): 类型节点 | null {
  const 所有类型节点 = 获得所有类型节点(源文件)
  return 所有类型节点[类型名] || null
}

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
      const 前缀 =
        ts
          .getModifiers(method)
          ?.map((mod) => mod.getText())
          .join(' ') + ' '
      结果 += `  ${前缀}${获得函数形式签名(method, 类型检查器, false)}\n`
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

export function 是类型节点(a: 节点): a is 类型节点 {
  if (ts.isTypeAliasDeclaration(a) || ts.isInterfaceDeclaration(a) || ts.isClassDeclaration(a)) {
    return true
  }
  return false
}
