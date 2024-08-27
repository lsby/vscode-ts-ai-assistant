import path from 'path'
import ts from 'typescript'
import { 类型节点 } from '../types/types'

export function 获得类型实现(a: 类型节点): string {
  return a.getText()
}

export function 获得类型定义位置(a: 类型节点): string {
  const 来源位置 = path.normalize(a.getSourceFile().fileName)
  return 来源位置
}

export function 获得类型节点类型(类型节点: ts.Node, 类型检查器: ts.TypeChecker): ts.Type {
  return 类型检查器.getTypeAtLocation(类型节点)
}
