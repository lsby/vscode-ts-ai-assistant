import { AST, 函数节点, 类型节点 } from './ast'

export type 类型引用 = {
  字面类型: string | null
  类型位置: string | null
  类型完整名称: string
  类型外层名称: string
}
export type 函数引用 = {
  函数名称: string
  函数位置: string
}

export type 类型信息 = {
  类型位置: string
  类型名称: string
  类型实现: string
}

export type 函数信息 = {
  函数位置: string
  函数名称: string
  函数签名: string
  函数jsdoc文本: string | null
  函数类型引用: 类型引用[]
  // todo 暂时只支持引用函数, 不支持引用类型
  函数jsdoc引用: ({ 内部名称: string } & 函数引用)[] | null
  函数实现: string
  函数文件内位置: { start: number; end: number }
}

export type 函数分析结果 = 函数信息 & {
  引用类型信息: 类型信息[]
  引用函数信息: ({ 内部名称: string } & 函数信息)[]
}

type 文件名 = string
type 类型名 = string
type 函数名 = string

export class 项目管理器 {
  private 类型记录: Record<文件名, Record<类型名, 类型信息>> = {}
  private 函数记录: Record<文件名, Record<函数名, 函数信息>> = {}

  constructor(private tsconfig路径: string) {}

  async 初始化(): Promise<void> {
    var 解析器 = new AST(this.tsconfig路径)
    await 解析器.初始化()

    for (var 源文件 of 解析器.获得源文件们()) {
      if (源文件.是dts文件()) continue

      // var 文件名 = 源文件.获得文件名()
      // console.log('开始处理文件: %o', 文件名)

      var 节点们 = 源文件.获得节点们()
      for (var 节点 of 节点们) {
        if (节点.是类型节点()) {
          await this.处理类型节点(节点.转换为类型节点())
        }
        if (节点.是函数声明节点()) {
          await this.处理函数节点(节点.转换为函数节点())
        }
      }
    }
  }

  private async 处理类型节点(节点: 类型节点): Promise<void> {
    var 位置 = 节点.获得文件位置()
    var 名称 = 节点.获得类型名称()
    var 实现 = 节点.获得类型实现()

    var 位置引用 = this.类型记录[位置]
    if (!位置引用) {
      位置引用 = {}
      this.类型记录[位置] = 位置引用
    }
    位置引用[名称] = { 类型位置: 位置, 类型名称: 名称, 类型实现: 实现 }
  }
  private async 处理函数节点(节点: 函数节点): Promise<void> {
    var 名称 = 节点.获得函数名称()
    if (名称 == null) return

    var 位置 = 节点.获得文件位置()
    var 签名 = 节点.获得函数签名()
    var 类型 = 节点.获得所有相关类型()
    var 实现 = 节点.获得函数完整实现()
    var 文件内位置 = 节点.获得函数文件内位置()
    var jsdoc = 节点.获得函数jsdoc说明()

    var 位置引用 = this.函数记录[位置]
    if (!位置引用) {
      位置引用 = {}
      this.函数记录[位置] = 位置引用
    }
    位置引用[名称] = {
      函数位置: 位置,
      函数名称: 名称,
      函数签名: 签名,
      函数jsdoc文本: jsdoc?.文本 || null,
      函数实现: 实现,
      函数文件内位置: 文件内位置,
      函数类型引用: 类型.map((a) => {
        var 类型位置 = a.获得路径() || null
        var 类型完整名称 = a.获得名称()
        var 类型外层名称 = a.获得外层名称()
        var 字面类型 = a.获得字面类型字符串()
        return { 类型位置, 类型完整名称, 类型外层名称, 字面类型 }
      }),
      函数jsdoc引用:
        jsdoc?.引用.map((a) => ({
          内部名称: a.内部名称,
          函数名称: a.目标名称,
          函数位置: a.目标位置,
        })) || null,
    }
  }

  获得类型信息(文件名: string | null, 类型名: string): 类型信息 | null {
    if (文件名 == null) return null
    return this.类型记录[文件名]?.[类型名] || null
  }
  获得函数信息(文件名: string, 函数名: string): 函数信息 | null {
    return this.函数记录[文件名]?.[函数名] || null
  }

  async 分析函数(文件名: string, 函数名: string): Promise<函数分析结果 | null> {
    var 函数信息 = this.获得函数信息(文件名, 函数名)
    if (函数信息 == null) return null

    // 初始化结果对象
    var 引用类型信息: 类型信息[] = []
    var 引用函数信息: ({ 内部名称: string } & 函数信息)[] = []

    // 用于跟踪已处理的函数和类型
    var 已处理函数: Set<string> = new Set()
    var 已处理类型: Set<string> = new Set()

    // 处理函数类型引用
    for (var 类型引用 of 函数信息.函数类型引用) {
      var 类型信息 = this.获得类型信息(类型引用.类型位置, 类型引用.类型完整名称)
      if (类型信息 && !已处理类型.has(`${类型引用.类型位置}::${类型引用.类型完整名称}`)) {
        引用类型信息.push(类型信息)
        已处理类型.add(`${类型引用.类型位置}::${类型引用.类型完整名称}`)
      }
    }

    // 递归处理函数 JSDoc 引用
    var 处理jsdoc引用 = async (jsdoc引用: ({ 内部名称: string } & 函数引用)[] | null): Promise<void> => {
      if (!jsdoc引用) return

      for (var jsdoc of jsdoc引用) {
        var 引用函数 = this.获得函数信息(jsdoc.函数位置, jsdoc.函数名称)
        if (引用函数 && !已处理函数.has(`${jsdoc.函数位置}::${jsdoc.函数名称}`)) {
          // 将当前引用函数信息添加到引用函数信息列表中
          引用函数信息.push({ 内部名称: jsdoc.内部名称, ...引用函数 })
          已处理函数.add(`${jsdoc.函数位置}::${jsdoc.函数名称}`)

          // 递归处理引用函数中的类型引用
          for (var 类型引用 of 引用函数.函数类型引用) {
            var 类型信息 = this.获得类型信息(类型引用.类型位置, 类型引用.类型完整名称)
            if (类型信息 && !已处理类型.has(`${类型引用.类型位置}::${类型引用.类型完整名称}`)) {
              引用类型信息.push(类型信息)
              已处理类型.add(`${类型引用.类型位置}::${类型引用.类型完整名称}`)
            }
          }

          // 递归处理引用函数的 JSDoc 引用
          await 处理jsdoc引用(引用函数.函数jsdoc引用)
        }
      }
    }

    // 调用递归处理函数
    await 处理jsdoc引用(函数信息.函数jsdoc引用)

    return {
      ...函数信息,
      引用类型信息,
      引用函数信息,
    }
  }
}
