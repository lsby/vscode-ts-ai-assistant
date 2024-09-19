import ts from 'typescript'

export type 范围 = { start: number; end: number }

export type 函数节点类型 = ts.FunctionDeclaration | ts.MethodDeclaration
export type 类节点类型 = ts.ClassDeclaration
export type JsDoc节点类型 = ts.JSDoc | ts.JSDocTag
