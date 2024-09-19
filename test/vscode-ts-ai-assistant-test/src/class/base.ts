import { 元组类型, 函数类型, 接口类型1, 枚举类型, 类型别名, 联合类型 } from '../type/type.js'

class 简单类 {
  属性: string

  constructor(属性: string) {
    this.属性 = 属性
  }
}

class 带私有属性的类 {
  private 私有属性: 枚举类型 = 枚举类型.蓝色
}

class 带静态属性的类 {
  static data: 接口类型1
}

class 引用函数的类 {
  constructor(private 方法: 函数类型) {}
}

class 引用联合的类 {
  constructor(private 属性: 联合类型) {}
}

class 引用元组的类 {
  constructor(private 元组: 元组类型) {}

  计算和(): number {
    throw new Error('todo')
  }
}

class 引用枚举的类 {
  constructor(private 颜色: 枚举类型) {}
}

class 引用别名的类 {
  constructor(private 属性: 类型别名) {}
}
