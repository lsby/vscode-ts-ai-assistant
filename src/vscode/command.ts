import * as vscode from 'vscode'
import { 计算函数提示词 } from './command/gen-func'
import { 计算类方法提示词 } from './command/gen-method'
import { 计算类提示词 } from './command/get-class'
import { 侧边栏视图提供者 } from './web-view'

export async function genFunc(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(函数名, 文件路径, false, null)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genFuncPrompt(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(函数名, 文件路径, false, null)
  const 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genFuncBody(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')

  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个函数?' })
  if (!要求) return

  var 提示词 = await 计算函数提示词(函数名, 文件路径, true, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genFuncPromptBody(函数名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')

  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个函数?' })
  if (!要求) return

  var 提示词 = await 计算函数提示词(函数名, 文件路径, true, 要求)
  const 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genMethod(起始位置: number, 方法名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')

  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个方法?' })
  if (!要求) return

  var 提示词 = await 计算类方法提示词(起始位置, 方法名, 文件路径, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genMethodPrompt(起始位置: number, 方法名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')

  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个方法?' })
  if (!要求) return

  var 提示词 = await 计算类方法提示词(起始位置, 方法名, 文件路径, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genClass(类名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')

  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个类?' })
  if (!要求) return

  var 提示词 = await 计算类提示词(类名, 文件路径, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genClassPrompt(类名: string, 文件路径: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')

  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个类?' })
  if (!要求) return

  var 提示词 = await 计算类提示词(类名, 文件路径, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}
