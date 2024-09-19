import {
  元组类型,
  函数类型,
  接口类型1,
  接口类型1的子项,
  接口类型2,
  枚举类型,
  类型别名,
  联合类型,
} from '../type/type.js'

export function 简单无参函数(): void {
  throw new Error('todo')
}

export function 函数引用接口1(_对象: 接口类型1): string {
  throw new Error('todo')
}
export function 函数引用接口2(): 接口类型2 {
  throw new Error('todo')
}

export function 函数引用函数(_输入: 函数类型): void {
  throw new Error('todo')
}

export function 函数引用联合(_输入: 联合类型): string {
  throw new Error('todo')
}

export function 函数引用元组(_元组: 元组类型): number {
  throw new Error('todo')
}

export function 函数引用枚举(_颜色: 枚举类型): string {
  throw new Error('todo')
}

export function 函数引用别名(_输入: 类型别名): number {
  throw new Error('todo')
}

/**
 * 这是jsdoc文本
 * 这里引用类型 {@link 接口类型1的子项}
 * 这里引用函数 {@link 函数引用接口2}
 */
export function 函数引用jsdoc(): void {
  throw new Error('todo')
}
