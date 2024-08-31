import ts from 'typescript'
import { 类方法节点, 类节点, 范围 } from '../types/types.js'
import { 获得所有类节点 } from './../source-file.js'
import { 获得节点范围 } from './node.js'

export function 通过名称获得类节点(源文件: ts.SourceFile, 类名: string): 类节点 | null {
  const 所有类节点 = 获得所有类节点(源文件)
  return 所有类节点[类名] || null
}

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

export function 获得类节点方法范围(节点: 类节点, 方法名: string, 源文件?: ts.SourceFile): 范围 | null {
  const 方法节点 = 节点.members.find(
    (member) => ts.isMethodDeclaration(member) && member.name.getText(源文件) === 方法名,
  )
  if (!方法节点) return null
  return 获得节点范围(方法节点, 源文件)
}

export function 获得类节点的所有方法(节点: ts.ClassDeclaration, 源文件?: ts.SourceFile): Record<string, 类方法节点> {
  const 方法记录: Record<string, 类方法节点> = {}

  节点.members.forEach((成员) => {
    if (ts.isMethodDeclaration(成员) || ts.isGetAccessor(成员) || ts.isSetAccessor(成员)) {
      const 方法名 = 成员.name.getText(源文件)
      方法记录[方法名] = 成员
    }
  })

  return 方法记录
}

export function 通过完整位置获得类节点(源文件: ts.SourceFile, 开始位置: number, 结束位置: number): 类节点 | null {
  const 所有类节点 = 获得所有类节点(源文件)
  for (const 类节点 of Object.values(所有类节点)) {
    const 节点范围 = 获得节点范围(类节点, 源文件)
    if (节点范围.start <= 开始位置 && 结束位置 <= 节点范围.end) {
      return 类节点
    }
  }
  return null
}
