import ts from 'typescript'
import { 类节点 } from '../types/types.js'
import { 获得所有类节点 } from './../source-file.js'
import { 获得节点范围 } from './node.js'

/**
 * 可以使用 {@link 获得所有类节点}
 */
export function 通过名称获得类节点(源文件: ts.SourceFile, 类名: string): 类节点 | null {
  const 所有类节点 = 获得所有类节点(源文件)
  return 所有类节点[类名] || null
}

/**
 * 可以使用 {@link 获得所有类节点}
 * 可以使用 {@link 获得节点范围}
 */
export function 通过位置获得类节点(源文件: ts.SourceFile, 位置: number): 类节点 | null {
  const 类节点们 = 获得所有类节点(源文件)

  for (const 节点 of Object.values(类节点们)) {
    const 范围 = 获得节点范围(节点, 源文件)
    if (范围.start <= 位置 && 位置 <= 范围.end) {
      return 节点
    }
  }

  return null
}

export function 获得类节点完整定义(节点: 类节点): string {
  return 节点.getText()
}

export function 获得类节点类型(函数节点: 类节点, 类型检查器: ts.TypeChecker): ts.Type {
  const 类型 = 类型检查器.getTypeAtLocation(函数节点)
  return 类型
}

/**
 * 可以使用 {@link 获得节点范围}
 */
export function 获得类节点方法范围(
  函数节点: 类节点,
  方法名: string,
  源文件?: ts.SourceFile,
): { start: number; end: number } | null {
  const 方法节点 = 函数节点.members.find(
    (member) => ts.isMethodDeclaration(member) && member.name.getText(源文件) === 方法名,
  )
  if (!方法节点) return null
  return 获得节点范围(方法节点, 源文件)
}
