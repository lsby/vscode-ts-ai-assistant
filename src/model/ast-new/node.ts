/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import path from 'path'
import ts from 'typescript'
import { 忽略单双引号比较, 路径在node_modules里, 路径是node原生类型, 遍历直接子节点 } from './tools'
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

  private 是基础类型(类型标志: ts.TypeFlags): boolean {
    return !!(
      类型标志 & ts.TypeFlags.StringLiteral ||
      类型标志 & ts.TypeFlags.NumberLiteral ||
      类型标志 & ts.TypeFlags.BooleanLiteral ||
      类型标志 & ts.TypeFlags.String ||
      类型标志 & ts.TypeFlags.Number ||
      类型标志 & ts.TypeFlags.Boolean ||
      类型标志 & ts.TypeFlags.Never
    )
  }
  private 计算函数签名(声明: ts.FunctionDeclaration): string {
    const printer = ts.createPrinter()
    const declarationWithoutBody = ts.factory.updateFunctionDeclaration(
      声明,
      声明.modifiers, // 保留修饰符（如 export、async 等）
      声明.asteriskToken, // 保留 generator 标记（如果有）
      声明.name, // 保留函数名
      声明.typeParameters, // 保留类型参数
      声明.parameters, // 保留参数列表
      声明.type, // 保留返回类型
      undefined, // 这里将函数体设为 undefined，这样只会保留声明部分
    )
    return printer.printNode(ts.EmitHint.Unspecified, declarationWithoutBody, 声明.getSourceFile())
  }
  private 计算类签名(声明: ts.ClassDeclaration): string {
    const printer = ts.createPrinter()

    // 遍历类的成员，保留属性和方法签名，不保留方法体
    const newMembers = 声明.members.map((member) => {
      if (ts.isMethodDeclaration(member)) {
        // 对于方法声明，移除方法体
        return ts.factory.updateMethodDeclaration(
          member,
          member.modifiers, // 保留修饰符
          member.asteriskToken, // 保留 generator 标记（如果有）
          member.name, // 保留方法名
          member.questionToken, // 保留可选标记（如果有）
          member.typeParameters, // 保留类型参数
          member.parameters, // 保留参数列表
          member.type, // 保留返回类型
          undefined, // 移除方法体
        )
      } else if (ts.isConstructorDeclaration(member)) {
        // 对于构造函数声明，移除构造函数体
        return ts.factory.updateConstructorDeclaration(
          member,
          member.modifiers,
          member.parameters,
          undefined, // 移除构造函数体
        )
      }
      // 对于属性声明，保留原始形式
      return member
    })

    // 更新类声明，保留类名、修饰符、继承等信息，但成员替换为我们处理后的新成员
    const declarationWithoutMethodBodies = ts.factory.updateClassDeclaration(
      声明,
      声明.modifiers, // 保留修饰符
      声明.name, // 保留类名
      声明.typeParameters, // 保留类型参数
      声明.heritageClauses, // 保留继承或实现的类/接口
      newMembers, // 使用新的成员列表
    )

    // 打印新的类声明节点
    const result = printer.printNode(ts.EmitHint.Unspecified, declarationWithoutMethodBodies, 声明.getSourceFile())

    return result
  }

  递归计算相关类型信息(conf: { 解析函数体内部: boolean; node_modules最大深度: number }): 类型信息[] {
    var 计算相关类型信息 = (
      当前节点: ts.Node,
      当前深度: number,
      已处理节点: Set<ts.Node>,
      已处理结果: Set<string>,
      是初始节点: boolean,
    ): 类型信息[] => {
      if (已处理节点.has(当前节点)) return []
      已处理节点.add(当前节点)

      var 遍历结果: 类型信息[] = []

      // 处理jsdoc
      var jsDoc节点 = new 节点(当前节点, this.类型检查器).获得JsDoc节点().map((a) => a.获得jsdoc节点())[0]
      if (jsDoc节点 && jsDoc节点.comment) {
        var 评论们 = jsDoc节点.comment
        for (var 评论 of 评论们) {
          if (typeof 评论 !== 'string' && ts.isJSDocLink(评论) && 评论.name) {
            var jsdoc声明 = this.类型检查器.getSymbolAtLocation(评论.name)?.getDeclarations()?.[0]
            if (jsdoc声明) {
              var 目标节点 = ts.isImportSpecifier(jsdoc声明)
                ? jsdoc声明.parent.parent.parent.moduleSpecifier
                : jsdoc声明
              var jsdoc结果 = 计算相关类型信息(目标节点, 当前深度 + 1, 已处理节点, 已处理结果, false)
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
      } catch (_e) {}
      var 类型标志 = 类型?.flags

      // 设置是否分析子节点
      var 分析当前节点 = true
      var 分析节点关联类型 = true
      // 对于函数体等区块, 只有配置了才会深入
      if (!conf.解析函数体内部 && ts.isBlock(当前节点)) {
        分析当前节点 = false
        分析节点关联类型 = false
      }
      // 如果不是初始节点, 就不要再深入其他函数或类的内容里了
      // 对于引用的内容, 只应该看其签名
      if (!是初始节点 && ts.isBlock(当前节点)) {
        分析当前节点 = false
        分析节点关联类型 = false
      }

      // 设置是否计算当前节点
      var 处理当前节点 = false
      var 处理节点关联类型 = false
      if (ts.isIdentifier(当前节点) || ts.isTypeReferenceNode(当前节点)) {
        处理当前节点 = true
        处理节点关联类型 = true
      }
      // 对于对象属性, 如果是基础类型, 就不用解析了
      if (
        (ts.isPropertySignature(当前节点.parent) ||
          ts.isPropertyDeclaration(当前节点.parent) ||
          ts.isPropertyAssignment(当前节点.parent) ||
          ts.isShorthandPropertyAssignment(当前节点.parent)) &&
        类型 &&
        类型标志 &&
        this.是基础类型(类型标志)
      ) {
        处理当前节点 = false
        处理节点关联类型 = false
      }

      // 决定需要处理的节点
      var 需要处理的节点: ts.Node[] = [
        处理当前节点 ? 当前节点 : null,
        处理节点关联类型 ? 类型?.symbol?.declarations?.[0] : null,
        处理节点关联类型 ? 类型?.aliasSymbol?.declarations?.[0] : null,
      ].filter((a) => a != null)

      if (需要处理的节点.length != 0) {
        for (var 声明 of 需要处理的节点) {
          var 符号实现: string | undefined
          var 符号位置: string | undefined

          // 处理基础类型
          if (类型 && 类型标志 && this.是基础类型(类型标志)) {
            符号实现 = this.类型检查器.typeToString(类型)
            符号位置 = path.normalize(当前节点.getSourceFile().fileName)
          }
          // 对于函数节点, 只取签名, 不取实现
          else if (ts.isFunctionDeclaration(声明)) {
            符号实现 = this.计算函数签名(声明)
            符号位置 = 声明?.getSourceFile().fileName
          }
          // 对于类节点也类似, 只取每个方法的签名, 不取实现
          else if (ts.isClassDeclaration(声明)) {
            符号实现 = this.计算类签名(声明)
            符号位置 = 声明?.getSourceFile().fileName
          }
          // 其他情况
          else {
            符号实现 = 声明?.getText()
            符号位置 = 声明?.getSourceFile().fileName
          }

          if (!符号位置) continue
          if (!符号实现) continue
          符号位置 = path.normalize(符号位置)

          // 如果找不到符号, 则跳过
          if (!符号实现 || !符号位置) {
          }
          // 如果在 node_modules 里, 且深度过大, 则跳过
          else if (路径在node_modules里(符号位置) && 当前深度 > conf.node_modules最大深度) {
          }
          // 如果在 node_modules 里, 且是 node 原生类型, 则跳过
          else if (路径在node_modules里(符号位置) && 路径是node原生类型(符号位置)) {
          }
          // 对于非独立的类型声明, 例如(type xxx = {yyy:zzz})的({yyy:zzz})部分, 跳过
          else if (声明 && ts.isTypeLiteralNode(声明)) {
          }
          // 节点名称完全等于符号实现的, 没有记录的意义, 跳过
          else if (节点名称 == 符号实现) {
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

      // 决定需要递归分析的节点
      var 需要分析的节点: ts.Node[] = [
        分析当前节点 ? 当前节点 : null,
        分析节点关联类型 ? 类型?.symbol?.declarations?.[0] : null,
        分析节点关联类型 ? 类型?.aliasSymbol?.declarations?.[0] : null,
      ].filter((a) => a != null)

      if (需要分析的节点.length != 0) {
        for (var 符号 of 需要分析的节点) {
          var 符号节点结果 = 遍历直接子节点(符号, (n) =>
            计算相关类型信息(n, 当前深度 + 1, 已处理节点, 已处理结果, false),
          ).flat()
          遍历结果.push(...符号节点结果)
        }
      }

      return 遍历结果
    }

    var 当前文件路径 = path.normalize(this.节点.getSourceFile().fileName)
    return 计算相关类型信息(this.节点, 0, new Set<ts.Node>(), new Set<string>(), true).sort((a, b) => {
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
