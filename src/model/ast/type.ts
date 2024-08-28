import path from 'path'
import ts from 'typescript'

export function 是引用类型(类型: ts.Type): boolean {
  if (类型.flags & ts.TypeFlags.Object && (类型 as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
    return true
  }
  return false
}
export function 是函数类型(类型: ts.Type, 类型检查器: ts.TypeChecker): boolean {
  if (类型检查器.getSignaturesOfType(类型, ts.SignatureKind.Call)[0]) {
    return true
  }
  return false
}
export function 是类类型(类型: ts.Type): boolean {
  if (类型.flags & ts.TypeFlags.Object && (类型 as ts.ObjectType).objectFlags & ts.ObjectFlags.Class) {
    return true
  }
  return false
}

export function 获得类型名称(类型: ts.Type, 类型检查器: ts.TypeChecker): string {
  return 类型检查器.typeToString(类型)
}
export function 获得类型所在文件(类型: ts.Type): string | null {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  var 定义 = 类型.aliasSymbol?.declarations?.[0] || 类型.symbol?.declarations?.[0] || null
  if (!定义) return null
  return path.normalize(定义.getSourceFile().fileName)
}
/**
 * 递归计算给定类型的所有关联类型
 * 例如, 对于引用类型或泛型类型, 除了要输入类型本身外, 还要它的所有泛型参数的类型
 * 对于函数类型, 则包含函数的参数和返回类型
 * 其他类型以此类推
 * 另外这里可以使用ts命名空间
 * 可以使用 {@link 是函数类型}
 * 可以使用 {@link 是引用类型}
 */
export function 获得所有相关类型(类型: ts.Type, 类型检查器: ts.TypeChecker): Array<ts.Type> {
  const 关联类型: Set<ts.Type> = new Set()

  function 添加类型(子类型: ts.Type): void {
    if (关联类型.has(子类型)) {
      return
    }

    关联类型.add(子类型)

    const 标志 = 子类型.getFlags()

    // 处理类型别名
    if (标志 & ts.SymbolFlags.TypeAlias) {
      子类型.symbol.members?.forEach((v) => {
        var 声明 = v.getDeclarations()?.[0]
        if (声明) {
          添加类型(类型检查器.getTypeOfSymbolAtLocation(v, 声明))
        }
      })
      if (子类型.symbol.valueDeclaration && ts.isClassDeclaration(子类型.symbol.valueDeclaration)) {
        子类型.symbol.valueDeclaration.members.forEach((v) => {
          添加类型(类型检查器.getTypeAtLocation(v))
        })
      }
      子类型.aliasSymbol?.members?.forEach((v) => {
        var 声明 = v.getDeclarations()?.[0]
        if (声明) {
          添加类型(类型检查器.getTypeOfSymbolAtLocation(v, 声明))
        }
      })
      子类型.aliasTypeArguments?.forEach((v) => {
        添加类型(v)
      })
      子类型.aliasSymbol?.declarations?.forEach((v) => {
        添加类型(类型检查器.getTypeAtLocation(v))
        if (子类型.aliasSymbol) {
          添加类型(类型检查器.getTypeOfSymbolAtLocation(子类型.aliasSymbol, v))
        }
      })
    }

    // 处理字面量类型
    if (标志 & ts.SymbolFlags.TypeLiteral) {
      子类型.symbol.members?.forEach((v) => {
        var 声明 = v.getDeclarations()?.[0]
        if (声明) {
          添加类型(类型检查器.getTypeOfSymbolAtLocation(v, 声明))
        }
      })
    }

    // 处理引用类型
    if (是引用类型(子类型)) {
      var 当前类型 = 子类型 as ts.TypeReference
      const 类型参数 = 类型检查器.getTypeArguments(当前类型)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (类型参数) {
        for (const 参数类型 of 类型参数) {
          添加类型(参数类型) // 递归添加类型参数
        }
      }
    }

    // 处理函数类型
    if (是函数类型(子类型, 类型检查器)) {
      const 签名 = 类型检查器.getSignaturesOfType(子类型, ts.SignatureKind.Call)
      for (const 函数签名 of 签名) {
        const 参数符号 = 函数签名.getParameters()
        for (const 参数的符号 of 参数符号) {
          if (参数的符号.valueDeclaration) {
            添加类型(类型检查器.getTypeOfSymbolAtLocation(参数的符号, 参数的符号.valueDeclaration))
          }
        }
        const 返回类型 = 函数签名.getReturnType()
        添加类型(返回类型) // 递归添加返回类型
      }
    }

    // 处理联合类型
    if (标志 & ts.TypeFlags.Union) {
      const 联合类型 = (子类型 as ts.UnionType).types
      for (const 联合子类型 of 联合类型) {
        添加类型(联合子类型) // 递归添加联合类型的每个部分
      }
    }

    // 处理交叉类型
    if (标志 & ts.TypeFlags.Intersection) {
      const 交叉类型 = (子类型 as ts.IntersectionType).types
      for (const 交叉子类型 of 交叉类型) {
        添加类型(交叉子类型) // 递归添加交叉类型的每个部分
      }
    }

    // 处理条件类型
    if (标志 & ts.TypeFlags.Conditional) {
      var 条件类型 = 子类型 as ts.ConditionalType
      return 添加类型(条件类型.checkType)
    }
  }

  添加类型(类型)
  return Array.from(关联类型) // 返回全部关联类型的数组
}

export function 解析引用类型名称(t: ts.TypeReferenceNode, 类型检查器: ts.TypeChecker): string {
  var 名称 = t.typeName.getText()
  var 参数们 = t.typeArguments?.map((a) => {
    if (ts.isTypeReferenceNode(a)) return 解析引用类型名称(a, 类型检查器)
    return 获得类型名称(类型检查器.getTypeAtLocation(a), 类型检查器)
  })
  return !参数们 || 参数们.length == 0 ? 名称 : `${名称}<${参数们.join(',')}>`
}
