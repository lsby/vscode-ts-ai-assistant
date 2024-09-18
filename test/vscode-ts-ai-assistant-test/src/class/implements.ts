import { 接口类型 } from '../type/type.js'

class 接口类型类 implements 接口类型 {
  姓名: string
  年龄: number

  constructor(姓名: string, 年龄: number) {
    this.姓名 = 姓名
    this.年龄 = 年龄
  }

  显示信息(): string {
    return `姓名: ${this.姓名}, 年龄: ${this.年龄}`
  }
}
