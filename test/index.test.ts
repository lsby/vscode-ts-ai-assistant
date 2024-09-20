import assert from 'assert'
import path from 'path'
import { describe, test } from 'vitest'
import { 程序 } from '../src/model/ast-new/program'

var tsconfig路径 = path.resolve(__dirname, './vscode-ts-ai-assistant-test/tsconfig.json')
var types路径 = path.resolve(__dirname, './vscode-ts-ai-assistant-test/node_modules/@types')

describe('程序测试', async () => {
  test('查找节点', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果1 = 程序实例.按名称查找函数节点('简单无参函数')
    assert(查找结果1 != null)
    assert(查找结果1.获得函数名() == '简单无参函数')

    var 查找结果2 = 程序实例.按名称查找类节点('简单类')
    assert(查找结果2 != null)
    assert(查找结果2.获得类名() == '简单类')

    var 查找结果3 = 程序实例.按范围查找节点(path.resolve(__dirname, './vscode-ts-ai-assistant-test/src/func/base.ts'), {
      start: 158,
      end: 158,
    })
    assert(查找结果3 != null)
    assert(查找结果3.转换为函数节点()?.获得函数名() == '简单无参函数')
  })
})
describe('函数测试', async () => {
  test('获得相关类型-函数引用接口1', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用接口1')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用接口1')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string') && 相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-函数引用接口2', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用接口2')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用接口2')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('c: string'))
  })
  test('获得相关类型-函数引用函数', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用函数')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用函数')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string'))
  })
  test('获得相关类型-函数引用联合', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用联合')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用联合')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string'))
  })
  test('获得相关类型-函数引用元组', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用元组')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用元组')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string'))
  })
  test('获得相关类型-函数引用枚举', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用枚举')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用枚举')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-函数引用别名', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用别名')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用别名')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string'))
  })
  test('获得相关类型-函数引用jsdoc', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找函数节点('函数引用jsdoc')
    assert(查找结果 != null)
    assert(查找结果.获得函数名() == '函数引用jsdoc')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string'))
  })
})
describe('类测试', async () => {
  test('获得相关类型-带私有属性的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('带私有属性的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '带私有属性的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('红色'))
  })
  test('获得相关类型-带静态属性的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('带静态属性的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '带静态属性的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('姓名: string') && 相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-引用函数的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('引用函数的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '引用函数的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string') && 相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-引用联合的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('引用联合的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '引用联合的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string') && 相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-引用元组的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('引用元组的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '引用元组的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string') && 相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-引用枚举的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('引用枚举的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '引用枚举的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-引用别名的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('引用别名的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '引用别名的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('蓝色'))
  })
  test('获得相关类型-派生类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('派生类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '派生类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('红色'))
  })
  test('获得相关类型-实现接口的类', async () => {
    var 程序实例 = 程序.创建程序(tsconfig路径, types路径)

    var 查找结果 = 程序实例.按名称查找类节点('实现接口的类')
    assert(查找结果 != null)
    assert(查找结果.获得类名() == '实现接口的类')

    var 相关类型 = 查找结果.递归计算相关类型信息()
    var 相关类型文本 = JSON.stringify(相关类型)
    assert(相关类型文本.indexOf('a: string') && 相关类型文本.indexOf('c: string') && 相关类型文本.indexOf('蓝色'))
  })
})
