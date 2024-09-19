import { 接口类型1, 接口类型1的子项, 枚举类型 } from '../type/type.js'

export class 实现接口的类 implements 接口类型1 {
  姓名: string
  年龄: number
  颜色: 枚举类型 = 枚举类型.红色
  子项: 接口类型1的子项 = { a: 'x', b: 1 }

  constructor(姓名: string, 年龄: number) {
    this.姓名 = 姓名
    this.年龄 = 年龄
  }

  显示信息(): string {
    return `姓名: ${this.姓名}, 年龄: ${this.年龄}`
  }
}
