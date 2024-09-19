export type 基本类型 = number | string | boolean

export interface 接口类型1 {
  姓名: string
  年龄: number
  颜色: 枚举类型
  子项: 接口类型1的子项
}
export interface 接口类型1的子项 {
  a: string
  b: number
}

export interface 接口类型2 {
  c: string
  d: number
}

export type 函数类型 = (输入: 接口类型1) => 接口类型2
export type 联合类型 = 接口类型1 | 接口类型2
export type 元组类型 = [接口类型1, 接口类型2]
export type 类型别名 = 接口类型1

export enum 枚举类型 {
  红色,
  绿色,
  蓝色,
}
