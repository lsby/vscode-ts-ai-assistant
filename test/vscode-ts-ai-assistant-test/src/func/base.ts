import { 元组类型, 函数类型, 基本类型, 接口类型, 枚举类型, 类型别名, 联合类型 } from '../type/type.js'

function 简单无参函数(): void {
  console.log('这是一个简单的无参函数')
}

function 带参数的函数(参数一: number, 参数二: number): number {
  return 参数一 + 参数二
}

function 基本类型函数(输入: 基本类型): 基本类型 {
  if (typeof 输入 === 'number') {
    return 输入 * 2
  } else if (typeof 输入 === 'string') {
    return 输入.toUpperCase()
  } else {
    return !输入
  }
}

function 接口类型函数(对象: 接口类型): string {
  return `${对象.姓名} 的年龄是 ${对象.年龄}`
}

function 函数类型函数(输入: 函数类型): number {
  return 输入(5) * 10
}

function 联合类型函数(输入: 联合类型): string {
  if (typeof 输入 === 'string') {
    return `字符串: ${输入}`
  } else {
    return `接口类型 - 姓名: ${输入.姓名}, 年龄: ${输入.年龄}`
  }
}

function 元组类型函数(元组: 元组类型): number {
  return 元组[0] + 元组[1]
}

function 枚举类型函数(颜色: 枚举类型): string {
  switch (颜色) {
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

function 类型别名函数(输入: 类型别名): number {
  return 输入.length
}
