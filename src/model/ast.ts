import path from 'path'
import ts from 'typescript'

export class AST {
  private 程序: ts.Program | null = null
  private 类型检查器: ts.TypeChecker | null = null

  constructor(private tsconfig路径: string) {}

  async 初始化(): Promise<void> {
    var 配置文件 = ts.readConfigFile(this.tsconfig路径, ts.sys.readFile)
    var 解析后的命令行 = ts.parseJsonConfigFileContent(配置文件.config, ts.sys, path.dirname(this.tsconfig路径))
    this.程序 = ts.createProgram(解析后的命令行.fileNames, 解析后的命令行.options)
    this.类型检查器 = this.程序.getTypeChecker()
  }

  获得源文件们(): 源文件[] {
    if (this.程序 == null || this.类型检查器 == null) {
      throw new Error('没有初始化')
    }
    var 类型检查器 = this.类型检查器
    return this.程序.getSourceFiles().map((a) => new 源文件(a, 类型检查器, this.tsconfig路径))
  }
}

export class 源文件 {
  constructor(
    private 源文件: ts.SourceFile,
    private 类型检查器: ts.TypeChecker,
    private tsconfig路径: string,
  ) {}

  是dts文件(): boolean {
    return this.源文件.isDeclarationFile
  }

  获得节点们(): 节点[] {
    var 节点们: 节点[] = []
    var 收集节点们 = (当前节点: ts.Node): void => {
      节点们.push(new 节点(当前节点, this.类型检查器, this.tsconfig路径))
      ts.forEachChild(当前节点, 收集节点们)
    }
    收集节点们(this.源文件)
    return 节点们
  }
  获得文件名(): string {
    return this.源文件.fileName
  }
  获得文本(): string {
    return this.源文件.getFullText()
  }
}

export class 节点 {
  constructor(
    private 节点: ts.Node,
    protected 类型检查器: ts.TypeChecker,
    protected tsconfig路径: string,
  ) {}

  获得文件位置(): string {
    return path.relative(this.tsconfig路径, this.节点.getSourceFile().fileName)
  }

  是函数声明节点(): boolean {
    return ts.isFunctionDeclaration(this.节点)
  }
  是函数节点(): boolean {
    if (
      ts.isFunctionDeclaration(this.节点) ||
      ts.isMethodDeclaration(this.节点) ||
      ts.isConstructorDeclaration(this.节点) ||
      ts.isFunctionLike(this.节点)
    ) {
      return true
    }
    return false
  }
  转换为函数节点(): 函数节点 {
    if (
      ts.isFunctionDeclaration(this.节点) ||
      ts.isMethodDeclaration(this.节点) ||
      ts.isConstructorDeclaration(this.节点) ||
      ts.isFunctionLike(this.节点)
    ) {
      return new 函数节点(this.节点, this.类型检查器, this.tsconfig路径)
    }
    throw new Error('转换失败')
  }

  是类节点(): boolean {
    return ts.isClassDeclaration(this.节点)
  }
  转换为类节点(): 类节点 {
    if (!ts.isClassDeclaration(this.节点)) throw new Error('转换失败')
    return new 类节点(this.节点, this.类型检查器, this.tsconfig路径)
  }

  是类型节点(): boolean {
    return (
      ts.isTypeAliasDeclaration(this.节点) ||
      ts.isInterfaceDeclaration(this.节点) ||
      ts.isEnumDeclaration(this.节点) ||
      ts.isModuleDeclaration(this.节点)
    )
  }

  转换为类型节点(): 类型节点 {
    if (
      ts.isTypeAliasDeclaration(this.节点) ||
      ts.isInterfaceDeclaration(this.节点) ||
      ts.isEnumDeclaration(this.节点) ||
      ts.isModuleDeclaration(this.节点)
    )
      return new 类型节点(this.节点, this.类型检查器, this.tsconfig路径)
    throw new Error('转换失败')
  }

  获得文本(): string {
    return this.节点.getText()
  }
  获得类型(): 类型 {
    return new 类型(null, this.类型检查器.getTypeAtLocation(this.节点), this.类型检查器, this.tsconfig路径)
  }
}
export class 类型节点 extends 节点 {
  constructor(
    private 类型节点: ts.TypeAliasDeclaration | ts.InterfaceDeclaration | ts.EnumDeclaration | ts.ModuleDeclaration,
    类型检查器: ts.TypeChecker,
    tsconfig路径: string,
  ) {
    super(类型节点, 类型检查器, tsconfig路径)
  }

  获得类型名称(): string {
    return this.类型节点.name.getText()
  }
  获得类型实现(): string {
    return this.类型节点.getText()
  }
}
export class 函数节点 extends 节点 {
  constructor(
    private 函数节点:
      | ts.FunctionDeclaration
      | ts.MethodDeclaration
      | ts.ConstructorDeclaration
      | ts.SignatureDeclaration,
    类型检查器: ts.TypeChecker,
    tsconfig路径: string,
  ) {
    super(函数节点, 类型检查器, tsconfig路径)
  }

  获得函数名称(): string | undefined {
    return this.函数节点.name?.getText()
  }
  获得函数泛型参数(): string {
    var typeParameters = this.函数节点.typeParameters?.map((param) => param.getText()).join(', ') || ''
    return typeParameters
  }
  获得函数签名(): string {
    var 名称 = this.获得函数名称()
    var 类型 = this.获得函数类型()
    var 泛型参数 = this.获得函数泛型参数()
    var 字符串泛型参数 = 泛型参数 == '' ? '' : `<${this.获得函数泛型参数()}>`
    return `function ${名称}${字符串泛型参数}${类型.获得名称()}`
  }
  获得函数完整实现(): string {
    return this.函数节点.getText()
  }
  获得函数文件内位置(): { start: number; end: number } {
    var start = this.函数节点.getStart()
    var end = this.函数节点.getEnd()
    return { start, end }
  }

  获得函数类型(): 函数类型 {
    return new 类型(
      null,
      this.类型检查器.getTypeAtLocation(this.函数节点),
      this.类型检查器,
      this.tsconfig路径,
    ).转换为函数类型()
  }

  是匿名函数(): boolean {
    return this.获得函数名称() == null
  }

  获得所有相关类型(): 类型[] {
    var 函数类型 = this.获得函数类型()
    var 结果 = 函数类型.获得所有相关类型()
    var 过滤后结果 = 结果
      .sort((a) => (a.获得字面类型字符串() ? -1 : 1))
      .filter((item, index) => 结果.findIndex((a) => 类型.相等(a, item)) == index)
      .reverse()
    return 过滤后结果
  }

  获得函数jsdoc说明(): { 文本: string; 引用: { 内部名称: string; 目标名称: string; 目标位置: string }[] } | null {
    var jsdoc = ts.getJSDocCommentsAndTags(this.函数节点)
    var 评论们 = jsdoc[0]?.comment
    if (jsdoc.length == 0 || 评论们 == null) return null

    var 文本结果 = ''
    var 引用: { 内部名称: string; 目标名称: string; 目标位置: string }[] = []

    if (typeof 评论们 == 'string') {
      文本结果 = 评论们
    } else {
      for (var 评论 of 评论们) {
        if (评论.kind == ts.SyntaxKind.JSDocText) {
          文本结果 += 评论.text
          continue
        }
        if (ts.isJSDocLink(评论)) {
          if (评论.name == null) continue

          var 字符串表示 = 评论.getText()
          var 导入的符号名称: string | null = null
          var 导入的符号位置: string | null = null

          var 提及内容 = this.类型检查器.getSymbolAtLocation(评论.name)
          var 声明 = 提及内容?.getDeclarations()?.[0]
          if (声明 && ts.isImportSpecifier(声明)) {
            var 目标符号 = this.类型检查器.getSymbolAtLocation(声明.parent.parent.parent.moduleSpecifier)
            if (目标符号) {
              导入的符号名称 = 声明.propertyName?.text || 声明.name.text || null
              var 文件路径 = 目标符号.getDeclarations()?.[0]?.getSourceFile().fileName
              if (文件路径 == null) return null
              导入的符号位置 = path.relative(this.tsconfig路径, 文件路径)
            }
          } else if (声明 && ts.isFunctionDeclaration(声明)) {
            导入的符号名称 = 声明.name?.getText() || null
            导入的符号位置 = path.relative(this.tsconfig路径, 声明.getSourceFile().fileName)
          }

          if (导入的符号名称 && 导入的符号位置) {
            var 重复检查 = 引用.find((a) => {
              return a.内部名称 == 字符串表示 && a.目标名称 == 导入的符号名称 && a.目标位置 == 导入的符号位置
            })
            if (!重复检查) {
              引用.push({ 内部名称: 字符串表示, 目标名称: 导入的符号名称, 目标位置: 导入的符号位置 })
            }
          }
          文本结果 += 字符串表示

          continue
        }
      }
    }

    return { 文本: 文本结果, 引用 }
  }
}

export class 类节点 extends 节点 {
  constructor(
    private 类节点: ts.ClassDeclaration,
    类型检查器: ts.TypeChecker,
    tsconfig路径: string,
  ) {
    super(类节点, 类型检查器, tsconfig路径)
  }

  获得名称(): string | undefined {
    return this.类节点.name?.getText()
  }
  获得构造函数(): { name: string; args: { name: string; type: 类型 }[] | undefined }[] {
    return this.类节点.members
      .filter((成员) => ts.isConstructorDeclaration(成员))
      .map((成员) => {
        var name = 'constructor'

        var 签名 = this.类型检查器.getSignatureFromDeclaration(成员)
        if (签名 == null) return { name, args: undefined }

        var 参数类型们 = 签名.parameters
          .map((参数) => {
            var 参数名称 = 参数.name
            var 参数声明 = 参数.valueDeclaration
            if (参数声明 == null) return null
            return {
              name: 参数名称,
              type: new 类型(null, this.类型检查器.getTypeAtLocation(参数声明), this.类型检查器, this.tsconfig路径),
            }
          })
          .filter((a) => a != null)

        return { name, args: 参数类型们 }
      })
  }
  获得方法们(): { name: string | undefined; func: 函数节点 }[] {
    return this.类节点.members
      .filter((成员) => ts.isMethodDeclaration(成员))
      .map((成员) => {
        var name = 成员.name.getText()
        var func = new 函数节点(成员, this.类型检查器, this.tsconfig路径)
        return { name, func }
      })
  }
  获得属性们(): { name: string | undefined; type: 类型 }[] {
    return this.类节点.members
      .filter((成员) => ts.isPropertyDeclaration(成员))
      .map((成员) => {
        var name = 成员.name.getText()
        var type = new 类型(null, this.类型检查器.getTypeAtLocation(成员), this.类型检查器, this.tsconfig路径)
        return { name, type }
      })
  }
  获得父类(): 节点 | undefined {
    if (this.类节点.heritageClauses) {
      for (var clause of this.类节点.heritageClauses) {
        if (clause.token == ts.SyntaxKind.ExtendsKeyword) {
          var v = clause.types[0]
          if (v != null) return new 节点(v, this.类型检查器, this.tsconfig路径)
        }
      }
    }
    return undefined
  }
  获得实现接口们(): 节点[] {
    if (this.类节点.heritageClauses) {
      for (var clause of this.类节点.heritageClauses) {
        if (clause.token == ts.SyntaxKind.ImplementsKeyword) {
          return clause.types.map((a) => new 节点(a, this.类型检查器, this.tsconfig路径))
        }
      }
    }
    return []
  }
}

export class 类型 {
  static 相等(a: 类型, b: 类型): boolean {
    return a.类型 == b.类型 && a.字面类型 == b.字面类型
  }

  constructor(
    protected 字面类型: string | null,
    protected 类型: ts.Type,
    protected 类型检查器: ts.TypeChecker,
    protected tsconfig路径: string,
  ) {}

  获得字面类型字符串(): string | null {
    return this.字面类型
  }
  获得名称(): string {
    if (this.是函数类型()) {
      var 函数类型 = this.转换为函数类型()
      var 参数类型 = 函数类型.获得函数参数类型()
      var 返回类型 = 函数类型.获得函数返回类型()
      return `(${参数类型
        .map((a) => `${a.参数名称}: ${a.实际类型.获得字面类型字符串() || a.实际类型.获得名称()}`)
        .join(', ')}): ${返回类型.获得字面类型字符串() || 返回类型.获得名称()}`
    }

    return this.类型检查器.typeToString(this.类型, undefined, ts.TypeFormatFlags.WriteArrayAsGenericType)
  }
  获得外层名称(): string {
    var 结果: string | null = null
    if (this.是引用类型()) {
      var 引用类型 = this.转换为引用类型()
      结果 = 引用类型.获得引用类型外层名称()
    } else if (this.是泛型类型()) {
      var 泛型类型 = this.转换为泛型类型()
      结果 = 泛型类型.获得泛型类型外层名称()
    }
    return 结果 || this.获得名称()
  }
  获得路径(): string | undefined {
    var 类型定义 = this.获得定义()
    if (!类型定义) return undefined

    if (ts.isClassDeclaration(类型定义) || ts.isInterfaceDeclaration(类型定义) || ts.isTypeAliasDeclaration(类型定义)) {
      return path.relative(this.tsconfig路径, 类型定义.getSourceFile().fileName)
    }

    return undefined
  }

  获得定义(): ts.Declaration | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return this.类型.aliasSymbol?.declarations?.[0] || this.类型.symbol?.declarations?.[0] || undefined
  }

  获得所有相关类型(已访问类型: Array<类型> = new Array<类型>()): 类型[] {
    var 实际类型 = this

    // todo 这里效率可以优化
    if (已访问类型.find((a) => 类型.相等(a, 实际类型))) return []
    已访问类型.push(实际类型)

    if (实际类型.是联合类型() && !实际类型.是布尔类型()) {
      return 实际类型
        .转换为联合类型()
        .获得联合类型成员()
        .flatMap((a) => a.获得所有相关类型(已访问类型))
    }

    if (实际类型.是交叉类型()) {
      return 实际类型
        .转换为交叉类型()
        .获得交叉类型成员()
        .flatMap((a) => a.获得所有相关类型(已访问类型))
    }

    if (实际类型.是引用类型()) {
      return [
        实际类型,
        ...实际类型
          .转换为引用类型()
          .获得引用类型成员()
          .flatMap((a) => a.获得所有相关类型(已访问类型)),
      ]
    }

    if (实际类型.是类型字面量()) {
      return [
        实际类型,
        ...实际类型
          .转换为类型字面量()
          .获得引用类型()
          .flatMap((a) => a.获得所有相关类型(已访问类型)),
      ]
    }

    if (实际类型.是函数类型()) {
      var 函数类型 = 实际类型.转换为函数类型()
      var 函数参数类型 = 函数类型.获得函数参数类型().map((a) => a.实际类型)
      var 函数返回类型 = 函数类型.获得函数返回类型()
      return [
        ...函数参数类型.flatMap((a) => a.获得所有相关类型(已访问类型)),
        ...函数返回类型.获得所有相关类型(已访问类型),
      ]
    }

    if (实际类型.是泛型类型()) {
      var 泛型类型们 = 实际类型.转换为泛型类型().获得泛型参数们()
      return [实际类型, ...泛型类型们.flatMap((a) => a.获得所有相关类型(已访问类型))]
    }

    return [实际类型]
  }

  是布尔类型(): boolean {
    return !!(this.类型.flags & ts.TypeFlags.Boolean)
  }

  是联合类型(): boolean {
    return (this.类型.flags & ts.TypeFlags.Union) == ts.TypeFlags.Union
  }
  转换为联合类型(): 联合类型 {
    if (!this.是联合类型()) throw new Error('转换失败')
    return new 联合类型(this.字面类型, this.类型, this.类型检查器, this.tsconfig路径)
  }

  是泛型类型(): boolean {
    if (this.类型.flags & ts.TypeFlags.Object && (this.类型 as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
      return true
    }
    if (this.类型.flags & ts.TypeFlags.Conditional) return true
    return false
  }
  转换为泛型类型(): 泛型类型 {
    if (!this.是泛型类型()) throw new Error('转换失败')
    return new 泛型类型(this.字面类型, this.类型, this.类型检查器, this.tsconfig路径)
  }

  是交叉类型(): boolean {
    return (this.类型.flags & ts.TypeFlags.Intersection) == ts.TypeFlags.Intersection
  }
  转换为交叉类型(): 交叉类型 {
    if (!this.是交叉类型()) throw new Error('转换失败')
    return new 交叉类型(this.字面类型, this.类型, this.类型检查器, this.tsconfig路径)
  }

  是引用类型(): boolean {
    if (this.类型.flags & ts.TypeFlags.Object && (this.类型 as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
      return true
    }
    return false
  }
  转换为引用类型(): 引用类型 {
    if (!this.是引用类型()) throw new Error('转换失败')
    return new 引用类型(this.字面类型, this.类型, this.类型检查器, this.tsconfig路径)
  }

  是函数类型(): boolean {
    if (this.类型.flags & ts.TypeFlags.Object && (this.类型 as ts.ObjectType).objectFlags & ts.ObjectFlags.Anonymous) {
      // 似乎有些非函数类型也会满足上面的条件, 为安全起见, 还是检查一下签名
      if (this.类型检查器.getSignaturesOfType(this.类型, ts.SignatureKind.Call)[0]) {
        return true
      }
    }
    return false
  }
  转换为函数类型(): 函数类型 {
    if (!this.是函数类型()) throw new Error('转换失败')
    return new 函数类型(this.类型, this.类型检查器, this.tsconfig路径)
  }

  是类型字面量(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.类型.symbol && this.类型.symbol.flags == ts.SymbolFlags.TypeLiteral && this.类型.symbol.members) {
      return true
    }
    return false
  }
  转换为类型字面量(): 类型字面量 {
    if (!this.是类型字面量()) throw new Error('转换失败')
    return new 类型字面量(null, this.类型, this.类型检查器, this.tsconfig路径)
  }
}
export class 类型字面量 extends 类型 {
  获得引用类型(): 类型[] {
    if (this.是类型字面量()) {
      var r: 类型[] = []
      this.类型.symbol.members?.forEach((v) => {
        var 声明 = v.getDeclarations()?.[0]
        if (声明)
          r.push(new 类型(null, this.类型检查器.getTypeOfSymbolAtLocation(v, 声明), this.类型检查器, this.tsconfig路径))
      })
      return r
    }
    return []
  }
}

export class 联合类型 extends 类型 {
  获得联合类型成员(): 类型[] {
    if (this.是联合类型()) {
      var 联合类型 = this.类型 as ts.UnionType
      return 联合类型.types.map((t) => new 类型(null, t, this.类型检查器, this.tsconfig路径))
    }
    return []
  }
}
export class 泛型类型 extends 类型 {
  获得泛型参数们(): 类型[] {
    if (this.类型.flags & ts.TypeFlags.Object && (this.类型 as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
      var 细化类型 = this.类型 as ts.TypeReference
      var 参数 = this.类型检查器.getTypeArguments(细化类型)
      return 参数.map((a) => new 类型(null, a, this.类型检查器, this.tsconfig路径))
    }
    if (this.类型.flags & ts.TypeFlags.Conditional) {
      var 条件类型 = this.类型 as ts.ConditionalType
      var 内部类型 = new 类型(null, 条件类型.checkType, this.类型检查器, this.tsconfig路径)
      return [内部类型]
    }
    return []
  }
  获得泛型类型外层名称(): string | null {
    if (this.类型.flags & ts.TypeFlags.Object && (this.类型 as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
      var 细化类型 = this.类型 as ts.TypeReference
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return 细化类型?.symbol.getName() || null
    }
    return null
  }
}
export class 交叉类型 extends 类型 {
  获得交叉类型成员(): 类型[] {
    if (this.是交叉类型()) {
      var 交叉类型 = this.类型 as ts.IntersectionType
      return 交叉类型.types.map((t) => new 类型(null, t, this.类型检查器, this.tsconfig路径))
    }
    return []
  }
}
export class 引用类型 extends 类型 {
  获得引用类型外层名称(): string | null {
    if (this.是引用类型()) {
      var 引用类型 = this.类型 as ts.TypeReference
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return 引用类型?.symbol.getName() || null
    }
    return null
  }
  获得引用类型成员(): 类型[] {
    if (this.是引用类型()) {
      var 引用类型 = this.类型 as ts.TypeReference
      if (引用类型.typeArguments) {
        return [...引用类型.typeArguments.map((t) => new 类型(null, t, this.类型检查器, this.tsconfig路径))]
      }
      return []
    }
    return []
  }
}
export class 函数类型 extends 类型 {
  private 签名: ts.Signature

  constructor(类型: ts.Type, 类型检查器: ts.TypeChecker, tsconfig路径: string) {
    super(null, 类型, 类型检查器, tsconfig路径)
    var 签名 = this.类型检查器.getSignaturesOfType(类型, ts.SignatureKind.Call)[0]
    if (签名 == null) throw new Error('无法解析函数签名')
    this.签名 = 签名
  }

  private 解析引用类型名称(t: ts.TypeReferenceNode): string {
    var 名称 = t.typeName.getText()
    var 参数们 = t.typeArguments?.map((a) => {
      if (ts.isTypeReferenceNode(a)) return this.解析引用类型名称(a)
      return new 类型(null, this.类型检查器.getTypeAtLocation(a), this.类型检查器, this.tsconfig路径).获得名称()
    })
    return !参数们 || 参数们.length == 0 ? 名称 : `${名称}<${参数们.join(',')}>`
  }

  获得函数参数类型(): { 参数名称: string; 实际类型: 类型 }[] {
    return this.签名
      .getParameters()
      .map((param) => {
        if (param.valueDeclaration && ts.isParameter(param.valueDeclaration) && param.valueDeclaration.type) {
          var 参数名称 = param.getName()
          var 参数类型 = param.valueDeclaration.type
          var 参数内部类型 = this.类型检查器.getTypeOfSymbol(param)

          if (ts.isTypeReferenceNode(参数类型)) {
            var 名称 = this.解析引用类型名称(参数类型)
            return {
              参数名称,
              实际类型: new 类型(名称, 参数内部类型, this.类型检查器, this.tsconfig路径),
            }
          }

          var 名称 = new 类型(null, 参数内部类型, this.类型检查器, this.tsconfig路径).获得名称()
          return {
            参数名称,
            实际类型: new 类型(名称, 参数内部类型, this.类型检查器, this.tsconfig路径),
          }
        }

        return null
      })
      .filter((a) => a != null)
  }
  获得函数返回类型(): 类型 {
    var 返回类型 = this.类型检查器.getReturnTypeOfSignature(this.签名)
    var 字面类型: string | null = null

    var 声明 = this.签名.declaration?.type
    if (声明 && ts.isTypeReferenceNode(声明)) {
      字面类型 = this.解析引用类型名称(声明)
    }

    return new 类型(字面类型, 返回类型, this.类型检查器, this.tsconfig路径)
  }
}
