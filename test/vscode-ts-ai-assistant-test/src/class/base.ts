import { 元组类型, 函数类型, 基本类型, 枚举类型, 类型别名, 联合类型 } from '../type/type.js'

class 简单类 {
  属性: string

  constructor(属性: string) {
    this.属性 = 属性
  }

  方法(): void {
    console.log(`这是一个简单类的方法，属性值是: ${this.属性}`)
  }
}

class 带私有属性的类 {
  private 私有属性: number = 0

  增加值(增量: number): void {
    this.私有属性 += 增量
  }

  获取私有属性(): number {
    return this.私有属性
  }
}

class 带静态属性的类 {
  static readonly 版本号 = '1.0.0'
  static readonly 接口地址 = 'https://example.com'
}

class 基本类型类 {
  属性: 基本类型

  constructor(属性: 基本类型) {
    this.属性 = 属性
  }

  显示属性(): string {
    return `属性的值是: ${this.属性}`
  }
}

class 函数类型类 {
  方法: 函数类型

  constructor(方法: 函数类型) {
    this.方法 = 方法
  }

  计算(输入: number): number {
    return this.方法(输入)
  }
}

class 联合类型类 {
  属性: 联合类型

  constructor(属性: 联合类型) {
    this.属性 = 属性
  }

  显示属性(): string {
    if (typeof this.属性 === 'string') {
      return `字符串属性: ${this.属性}`
    } else {
      return `接口属性 - 姓名: ${this.属性.姓名}, 年龄: ${this.属性.年龄}`
    }
  }
}

class 元组类型类 {
  元组: 元组类型

  constructor(元组: 元组类型) {
    this.元组 = 元组
  }

  计算和(): number {
    return this.元组[0] + this.元组[1]
  }
}

class 枚举类型类 {
  颜色: 枚举类型

  constructor(颜色: 枚举类型) {
    this.颜色 = 颜色
  }

  显示颜色(): string {
    switch (this.颜色) {
      case 枚举类型.红色:
        return '红色'
      case 枚举类型.绿色:
        return '绿色'
      case 枚举类型.蓝色:
        return '蓝色'
      default:
        return '未知颜色'
    }
  }
}

class 类型别名类 {
  属性: 类型别名

  constructor(属性: 类型别名) {
    this.属性 = 属性
  }

  获取长度(): number {
    return this.属性.length
  }
}
