import path from 'path'
import ts from 'typescript'
import { 函数节点, 类节点, 节点 } from './node'
import { 范围 } from './type'

export class 程序 {
  static 创建程序(tsconfig路径: string, types路径: string): 程序 {
    const tsconfig内容 = ts.readConfigFile(tsconfig路径, ts.sys.readFile)
    const tsconfig解析结果 = ts.parseJsonConfigFileContent(tsconfig内容.config, ts.sys, path.dirname(tsconfig路径))
    return new 程序(
      ts.createProgram(tsconfig解析结果.fileNames, {
        ...tsconfig解析结果.options,
        typeRoots: [types路径],
      }),
    )
  }

  private 类型检查器: ts.TypeChecker
  private constructor(private 程序: ts.Program) {
    this.类型检查器 = 程序.getTypeChecker()
  }

  按名称查找函数节点(名称: string): 函数节点 | null {
    var self = this
    const 源文件集合 = this.程序.getSourceFiles()

    for (const 源文件 of 源文件集合) {
      const 节点 = ts.forEachChild(源文件, function 查找函数节点(node): 函数节点 | null {
        if (ts.isFunctionDeclaration(node) && node.name?.text === 名称) {
          return new 函数节点(node, self.类型检查器)
        }
        return ts.forEachChild(node, 查找函数节点) || null
      })

      if (节点) return 节点
    }

    return null
  }
  按名称查找类节点(名称: string): 类节点 | null {
    var self = this
    const 源文件集合 = this.程序.getSourceFiles()

    for (const 源文件 of 源文件集合) {
      const 节点 = ts.forEachChild(源文件, function 查找类节点(node): 类节点 | null {
        if (ts.isClassDeclaration(node) && node.name?.text === 名称) {
          return new 类节点(node, self.类型检查器)
        }
        return ts.forEachChild(node, 查找类节点) || null
      })

      if (节点) return 节点
    }

    return null
  }
  按范围查找节点(文件路径: string, 范围: 范围): 节点 | null {
    var self = this
    const 源文件集合 = this.程序.getSourceFiles()

    for (const 源文件 of 源文件集合) {
      var 源文件路径 = path.normalize(源文件.fileName)
      var 目标文件路径 = path.normalize(文件路径)
      if (源文件路径 !== 目标文件路径) {
        continue
      }

      const 节点结果 = ts.forEachChild(源文件, function 查找节点(node): 节点 | null {
        const nodeStart = node.getStart()
        const nodeEnd = node.getEnd()

        if (nodeStart <= 范围.start && 范围.end <= nodeEnd) {
          return new 节点(node, self.类型检查器)
        }
        return ts.forEachChild(node, 查找节点) || null
      })

      if (节点结果) return 节点结果
    }

    return null
  }
}
