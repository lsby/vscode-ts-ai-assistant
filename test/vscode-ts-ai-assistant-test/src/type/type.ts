export type 基本类型 = number | string | boolean

export interface 接口类型 {
  姓名: string
  年龄: number
}

export type 函数类型 = (输入: number) => number

export type 联合类型 = string | 接口类型

export type 元组类型 = [number, number]

export enum 枚举类型 {
  红色,
  绿色,
  蓝色,
}

export type 类型别名 = string
