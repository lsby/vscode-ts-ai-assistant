import ts from 'typescript'

export type 类型节点 = ts.TypeAliasDeclaration | ts.InterfaceDeclaration | ts.ClassDeclaration
export type 函数节点 = ts.FunctionDeclaration | ts.MethodDeclaration
export type 节点 = 类型节点 | 函数节点
