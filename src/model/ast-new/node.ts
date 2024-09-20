/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import path from 'path'
import ts from 'typescript'
import { 忽略单双引号比较, 路径在node_modules里, 遍历直接子节点 } from './tools'
import { JsDoc节点类型, 函数节点类型, 类型信息, 类节点类型, 范围 } from './type'

export class 节点 {
  constructor(
    protected 节点: ts.Node,
    protected 类型检查器: ts.TypeChecker,
  ) {}

  转换为函数节点(): 函数节点 | null {
    if (ts.isFunctionDeclaration(this.节点) || ts.isMethodDeclaration(this.节点)) {
      return new 函数节点(this.节点, this.类型检查器)
    }
    return null
  }
  转换为类节点(): 类节点 | null {
    if (ts.isClassDeclaration(this.节点)) {
      return new 类节点(this.节点, this.类型检查器)
    }
    return null
  }

  获得JsDoc节点(): JsDoc节点[] {
    var jsDocNodes = ts.getJSDocCommentsAndTags(this.节点)
    return jsDocNodes.map((a) => new JsDoc节点(a, this.类型检查器))
  }
  获得JsDoc完整文本(): string | null {
    var jsdoc = this.获得JsDoc节点()
    if (jsdoc.length == 0) return null
    return jsdoc.map((a) => a.获得节点全文()).join('\n')
  }

  获得节点范围(): 范围 {
    return {
      start: this.节点.getStart(),
      end: this.节点.getEnd(),
    }
  }
  获得节点全文(): string {
    return this.节点.getText()
  }

  递归计算相关类型信息(): 类型信息[] {
    var 计算相关类型信息 = (
      当前节点: ts.Node,
      当前深度: number,
      已处理节点: Set<ts.Node>,
      已处理结果: Set<string>,
    ): 类型信息[] => {
      var 最大深度 = 5

      if (已处理节点.has(当前节点)) return []
      已处理节点.add(当前节点)

      var 遍历结果: 类型信息[] = []

      // 处理jsdoc
      var jsDoc节点 = new 节点(当前节点, this.类型检查器).获得JsDoc节点().map((a) => a.获得jsdoc节点())[0]
      if (jsDoc节点 && jsDoc节点.comment) {
        var 评论们 = jsDoc节点.comment
        for (var 评论 of 评论们) {
          if (typeof 评论 !== 'string' && ts.isJSDocLink(评论) && 评论.name) {
            var 声明 = this.类型检查器.getSymbolAtLocation(评论.name)?.getDeclarations()?.[0]
            if (声明) {
              var 目标节点 = ts.isImportSpecifier(声明) ? 声明.parent.parent.parent.moduleSpecifier : 声明
              var jsdoc结果 =
                this.类型检查器
                  .getSymbolAtLocation(目标节点)
                  ?.declarations?.flatMap((n) => 计算相关类型信息(n, 当前深度 + 1, 已处理节点, 已处理结果)) || []
              遍历结果.push(...jsdoc结果)
            }
          }
        }
      }

      // 获得类型
      var 节点名称 = 当前节点.getText()
      var 类型: ts.Type | undefined
      try {
        类型 = this.类型检查器.getTypeAtLocation(当前节点)
      } catch (e) {}
      var 类型符号声明们 = [类型?.symbol?.declarations?.[0], 类型?.aliasSymbol?.declarations?.[0]]
      var 类型标志 = 类型?.flags

      // 有必要时, 将本标记设为假, 以说明不再解析该节点的子节点和子类型节点
      var 解析子节点 = true

      // 对于标识符, 例如(var x = 1)的(x), 跳过
      if (ts.isIdentifier(当前节点)) {
      }
      // 对于(参数名称: 类型)这样的节点, 跳过
      else if (ts.isParameter(当前节点) && 当前节点.type && ts.isTypeReferenceNode(当前节点.type)) {
      }
      // 对于属性的某一个字段声明, 例如(type xxx = {yyy:zzz})的(yyy)部分, 跳过
      else if (ts.isPropertySignature(当前节点)) {
      }
      // 对于区块, 例如函数体, 不解析其整体, 也不再继续解析
      // todo:
      // 如果需要知道函数体里的各种语句的类型, 那就不应该过滤这个
      // 也许应该做个参数, 让用户自行决定
      else if (ts.isBlock(当前节点)) {
        解析子节点 = false
      }
      // 对于非独立的类型声明, 例如(type xxx = {yyy:zzz})的({yyy:zzz})部分, 跳过
      else if (ts.isTypeLiteralNode(当前节点)) {
      }
      // 对于函数或方法的整体, 跳过
      // todo:
      // 不太好, 对于类还可以, 因为类的整体会给出, 对于单独的函数, 如果把本体过滤掉, 就不知道函数的样子了
      // 也许应该判断当前用户是在生成类, 方法, 还是函数, 来决定
      // else if (ts.isFunctionDeclaration(当前节点) || ts.isMethodDeclaration(当前节点)) {
      // }
      // 对于原始类型, 要特殊处理
      else if (
        类型 &&
        类型标志 &&
        (类型标志 & ts.TypeFlags.StringLiteral ||
          类型标志 & ts.TypeFlags.NumberLiteral ||
          类型标志 & ts.TypeFlags.BooleanLiteral ||
          类型标志 & ts.TypeFlags.String ||
          类型标志 & ts.TypeFlags.Number ||
          类型标志 & ts.TypeFlags.Boolean ||
          类型标志 & ts.TypeFlags.Never)
      ) {
        var 原始类型值 = this.类型检查器.typeToString(类型)
        var 原始类型位置 = path.normalize(当前节点.getSourceFile().fileName)
        if (当前深度 <= 最大深度 || !路径在node_modules里(原始类型位置)) {
          var 唯一标识 = JSON.stringify({ 节点名称, 原始类型值, 原始类型位置 })
          if (!已处理结果.has(唯一标识) && !忽略单双引号比较(节点名称, 原始类型值)) {
            遍历结果.push({ 节点名称, 实现: 原始类型值, 位置: 原始类型位置, 深度: 当前深度 })
            已处理结果.add(唯一标识)
          }
        }
      }
      // 其他情况, 获得类型的符号, 然后计算符号的文本
      else {
        for (var 声明 of 类型符号声明们) {
          var 符号实现 = 声明?.getText()
          var 符号位置 = 声明?.getSourceFile().fileName
          if (符号位置) 符号位置 = path.normalize(符号位置)

          // 如果找不到符号, 就什么都不做
          if (!符号实现 || !符号位置) {
          }
          // 如果在 node_modules 里, 且深度过大, 不写入结果
          else if (当前深度 > 最大深度 && 路径在node_modules里(符号位置)) {
          }
          // 对于非独立的类型声明, 例如(type xxx = {yyy:zzz})的({yyy:zzz})部分, 跳过
          else if (声明 && ts.isTypeLiteralNode(声明)) {
          }
          // 其他情况, 写入结果
          else {
            var 唯一标识 = JSON.stringify({ 符号实现, 符号位置 })
            if (!已处理结果.has(唯一标识) && !忽略单双引号比较(节点名称, 符号位置)) {
              遍历结果.push({ 节点名称, 实现: 符号实现, 位置: 符号位置, 深度: 当前深度 })
              已处理结果.add(唯一标识)
            }
          }
        }
      }

      if (解析子节点) {
        // 递归分析当前节点的子节点
        var 子节点结果 = 遍历直接子节点(当前节点, (n) =>
          计算相关类型信息(n, 当前深度 + 1, 已处理节点, 已处理结果),
        ).flat()
        遍历结果.push(...子节点结果)

        // 递归分析类型符号的子节点
        for (var 符号 of 类型符号声明们) {
          if (!符号) continue
          var 符号节点结果 = 遍历直接子节点(符号, (n) =>
            计算相关类型信息(n, 当前深度 + 1, 已处理节点, 已处理结果),
          ).flat()
          遍历结果.push(...符号节点结果)
        }
      }

      return 遍历结果
    }

    var 当前文件路径 = path.normalize(this.节点.getSourceFile().fileName)
    return 计算相关类型信息(this.节点, 0, new Set<ts.Node>(), new Set<string>()).sort((a, b) => {
      if (a.位置 == 当前文件路径 && b.位置 != 当前文件路径) return -1
      if (a.位置 != 当前文件路径 && b.位置 == 当前文件路径) return 1

      if (a.位置 == 当前文件路径 && b.位置 == 当前文件路径) {
        return a.节点名称.localeCompare(b.节点名称)
      }

      if (a.位置 == b.位置) return a.节点名称.localeCompare(b.节点名称)
      return a.位置.localeCompare(b.位置)
    })
  }
}

export class 函数节点 extends 节点 {
  constructor(
    private 函数节点: 函数节点类型,
    类型检查器: ts.TypeChecker,
  ) {
    super(函数节点, 类型检查器)
  }

  获得函数名(): string | null {
    return this.函数节点.name ? this.函数节点.name.getText() : null
  }
  获得函数节点(): 函数节点类型 {
    return this.函数节点
  }
}

export class 类节点 extends 节点 {
  constructor(
    private 类节点: 类节点类型,
    类型检查器: ts.TypeChecker,
  ) {
    super(类节点, 类型检查器)
  }
  获得类名(): string | null {
    return this.类节点.name ? this.类节点.name.getText() : null
  }
  获得类节点(): 类节点类型 {
    return this.类节点
  }
  按方法名称获得方法范围(方法名称: string): 范围 | null {
    var 类节点 = this.获得类节点()
    var 方法符号 = this.类型检查器.getTypeAtLocation(类节点).getProperty(方法名称)

    if (!方法符号) return null

    var 方法声明 = 方法符号.getDeclarations()?.[0]
    if (!方法声明) return null

    var 开始 = 方法声明.getStart()
    var 结束 = 方法声明.getEnd()

    return { start: 开始, end: 结束 }
  }
}

export class JsDoc节点 extends 节点 {
  constructor(
    private JsDoc节点: JsDoc节点类型,
    类型检查器: ts.TypeChecker,
  ) {
    super(JsDoc节点, 类型检查器)
  }
  获得jsdoc节点(): JsDoc节点类型 {
    return this.JsDoc节点
  }
}
