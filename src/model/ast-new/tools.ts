import path from 'path'
import ts from 'typescript'

export function 路径在node_modules里(路径: string): boolean {
  var 分组的路径 = path.normalize(路径).split(path.sep)
  for (var i = 0; i < 分组的路径.length; i++) {
    if (分组的路径[i] == 'node_modules') {
      return true
    }
  }
  return false
}
export function 遍历所有子节点<A>(节点: ts.Node, 函数: (子节点: ts.Node) => A): A[] {
  var 结果: A[] = []
  节点.forEachChild((子节点) => {
    结果.push(函数(子节点))
    结果.push(...遍历所有子节点(子节点, 函数))
  })
  return 结果
}
export function 遍历直接子节点<A>(节点: ts.Node, 函数: (子节点: ts.Node) => A): A[] {
  var 结果: A[] = []
  节点.forEachChild((子节点) => {
    结果.push(函数(子节点))
  })
  return 结果
}
export function 忽略单双引号比较(字符串a: string, 字符串b: string): boolean {
  const 处理后的a = 字符串a.replace(/['"]/g, '"')
  const 处理后的b = 字符串b.replace(/['"]/g, '"')
  return 处理后的a === 处理后的b
}
