import ts from 'typescript'
import { 范围 } from '../base/base'
import { 类型 } from '../type/type'

export class 节点 {
  constructor(
    protected 节点: ts.Node,
    protected 类型检查器: ts.TypeChecker,
  ) {}

  转换为函数节点(): 函数节点 {
    if (ts.isFunctionDeclaration(this.节点) || ts.isFunctionExpression(this.节点) || ts.isArrowFunction(this.节点)) {
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
  是JsDoc节点(): this is JsDoc节点 {
    return ts.isJSDoc(this.节点)
  }
  获得节点范围(): 范围 {
    return {
      start: this.节点.getStart(),
      end: this.节点.getEnd(),
    }
  }
  获得节点jsdoc(): JsDoc节点 | null {
    const jsDocNodes = ts.getJSDocTags(this.节点)[0]
    if (jsDocNodes) {
      return new JsDoc节点(jsDocNodes, this.类型检查器)
    }
    return null
  }
  获得节点类型(): 类型 {
    const 类型结果 = this.类型检查器.getTypeAtLocation(this.节点)
    return new 类型(类型结果)
  }
}

export class 函数节点 extends 节点 {
  获得函数名(): string | null {
    if (ts.isFunctionDeclaration(this.节点) || ts.isFunctionExpression(this.节点) || ts.isArrowFunction(this.节点)) {
      return this.节点.name ? this.节点.name.getText() : null
    }
    return null
  }
  获得函数形式类型(): string {
    throw new Error('todo')
  }
  获得函数实际类型(): string {
    throw new Error('todo')
  }
}

export class 类节点 extends 节点 {
  获得类名(): string | null {
    if (ts.isClassDeclaration(this.节点)) {
      return this.节点.name ? this.节点.name.getText() : null
    }
    return null
  }
}

export class JsDoc节点 extends 节点 {
  获得提及类型(): 类型 {
    throw new Error('todo')
  }
}
