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

function 简单无参函数(): void {
  throw new Error('todo')
}

function 函数引用接口1(对象: 接口类型1): string {
  throw new Error('todo')
}
function 函数引用接口2(): 接口类型2 {
  throw new Error('todo')
}

function 函数引用函数(输入: 函数类型): void {
  throw new Error('todo')
}

function 函数引用联合(输入: 联合类型): string {
  throw new Error('todo')
}

function 函数引用元组(元组: 元组类型): number {
  throw new Error('todo')
}

function 函数引用枚举(颜色: 枚举类型): string {
  throw new Error('todo')
}

function 函数引用别名(输入: 类型别名): number {
  throw new Error('todo')
}

/**
 * 这是jsdoc文本
 * 这里引用类型 {@link 接口类型1的子项}
 * 这里引用函数 {@link 函数引用接口2}
 */
function 函数引用jsdoc(): void {
  throw new Error('todo')
}
