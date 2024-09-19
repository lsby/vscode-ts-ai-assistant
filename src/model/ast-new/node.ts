import ts from 'typescript'
import { JsDoc节点类型, 函数节点类型, 类节点类型, 范围 } from './type'

export class 节点 {
  constructor(
    protected 节点: ts.Node,
    protected 类型检查器: ts.TypeChecker,
  ) {}

  转换为函数节点(): 函数节点 {
    if (ts.isFunctionDeclaration(this.节点) || ts.isMethodDeclaration(this.节点)) {
      return new 函数节点(this.节点, this.类型检查器)
    }
    throw new Error('当前节点不是函数声明，无法转换为函数节点')
  }
  转换为类节点(): 类节点 {
    if (ts.isClassDeclaration(this.节点)) {
      return new 类节点(this.节点, this.类型检查器)
    }
    throw new Error('当前节点不是类声明，无法转换为类节点')
  }
  获得JsDoc节点(): JsDoc节点[] {
    const jsDocNodes = ts.getJSDocCommentsAndTags(this.节点)
    return jsDocNodes.map((a) => new JsDoc节点(a, this.类型检查器))
  }
  获得节点范围(): 范围 {
    return {
      start: this.节点.getStart(),
      end: this.节点.getEnd(),
    }
  }

  递归获得相关类型(): { 节点名称: string; 类型定义: string; 定义位置: string }[] {
    const 结果: { 节点名称: string; 类型: ts.Type }[] = []
    const 已处理节点 = new Set<ts.Node>()

    const 访问器 = (子节点: ts.Node): void => {
      if (已处理节点.has(子节点)) return
      已处理节点.add(子节点)

      const 节点名称 = 子节点.getText()
      const 类型 = this.类型检查器.getTypeAtLocation(子节点)
      const 类型节点 = 类型.getSymbol()?.declarations?.[0]
      const 符号 = this.类型检查器.getSymbolAtLocation(子节点)
      const 符号节点 = 符号?.declarations?.[0]
      const jsDoc节点 = new 节点(子节点, this.类型检查器).获得JsDoc节点().map((a) => a.获得jsdoc节点())[0]

      结果.push({ 节点名称, 类型 })

      ts.forEachChild(子节点, 访问器)
      if (类型节点) ts.forEachChild(类型节点, 访问器)
      if (符号节点) ts.forEachChild(符号节点, 访问器)
      if (jsDoc节点 && jsDoc节点.comment) {
        var 评论们 = jsDoc节点.comment
        for (var 评论 of 评论们) {
          if (typeof 评论 != 'string' && ts.isJSDocLink(评论) && 评论.name) {
            var 提及内容 = this.类型检查器.getSymbolAtLocation(评论.name)
            var 声明 = 提及内容?.getDeclarations()?.[0]
            if (声明 && ts.isImportSpecifier(声明)) {
              var 目标符号 = this.类型检查器.getSymbolAtLocation(声明.parent.parent.parent.moduleSpecifier)
              var 符号声明 = 目标符号?.declarations?.[0]
              if (符号声明) ts.forEachChild(符号声明, 访问器)
            }
            if (声明) ts.forEachChild(声明, 访问器)
          }
        }
      }
    }
    访问器(this.节点)

    const 最终结果: { 节点名称: string; 类型定义: string; 定义位置: string }[] = []
    const 已处理组合 = new Set<string>()

    for (const 项 of 结果) {
      const 节点名称 = 项.节点名称
      const 类型定义 = 项.类型.getSymbol()?.declarations?.[0]?.getText()
      if (!类型定义) continue
      const 定义位置 = 项.类型.getSymbol()?.declarations?.[0]?.getSourceFile().fileName
      if (!定义位置) continue
      if (节点名称 == 类型定义) continue

      const 唯一标识 = `${类型定义}-${定义位置}`
      if (!已处理组合.has(唯一标识)) {
        已处理组合.add(唯一标识)
        最终结果.push({ 节点名称, 类型定义, 定义位置 })
      }
    }

    return 最终结果
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
