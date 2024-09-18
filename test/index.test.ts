import assert from 'assert'
import path from 'path'
import { describe, test } from 'vitest'
import { 程序 } from '../src/model/ast-new/program'

describe('程序测试', () => {
  test('查找节点', async () => {
    var 程序实例 = 程序.创建程序(
      path.resolve(__dirname, './vscode-ts-ai-assistant-test/tsconfig.json'),
      path.resolve(__dirname, './vscode-ts-ai-assistant-test/node_modules/@types'),
    )

    var 查找结果1 = 程序实例.按名称查找函数节点('简单无参函数')
    assert(查找结果1 != null)
    assert(查找结果1.获得函数名() == '简单无参函数')

    var 查找结果2 = 程序实例.按名称查找类节点('简单类')
    assert(查找结果2 != null)
    assert(查找结果2.获得类名() == '简单类')

    var 查找结果3 = 程序实例.按范围查找节点(path.resolve(__dirname, './vscode-ts-ai-assistant-test/src/func/base.ts'), {
      start: 111,
      end: 112,
    })
    assert(查找结果3 != null)
    assert(查找结果3.转换为函数节点().获得函数名() == '简单无参函数')
  })
})
