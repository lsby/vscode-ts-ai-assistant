import * as vscode from 'vscode'
import { 计算优化代码片段提示词 } from './command/gen-code'
import { 计算函数提示词 } from './command/gen-func'
import { 计算类方法提示词 } from './command/gen-method'
import { 计算类提示词 } from './command/get-class'
import { 侧边栏视图提供者 } from './web-view'

export async function genFunc(文件路径: string, 函数名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(文件路径, 函数名, null, false)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genFuncPrompt(文件路径: string, 函数名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  var 提示词 = await 计算函数提示词(文件路径, 函数名, null, false)
  const 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genFuncBody(文件路径: string, 函数名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个函数?' })
  if (要求 == undefined) return
  var 提示词 = await 计算函数提示词(文件路径, 函数名, 要求, true)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genFuncPromptBody(文件路径: string, 函数名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个函数?' })
  if (要求 == undefined) return
  var 提示词 = await 计算函数提示词(文件路径, 函数名, 要求, true)
  const 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genMethod(文件路径: string, 开始位置: number, 方法名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个方法?' })
  if (要求 == undefined) return
  var 提示词 = await 计算类方法提示词(文件路径, 开始位置, 方法名, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genMethodPrompt(文件路径: string, 开始位置: number, 方法名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个方法?' })
  if (要求 == undefined) return
  var 提示词 = await 计算类方法提示词(文件路径, 开始位置, 方法名, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genClass(文件路径: string, 类名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个类?' })
  if (要求 == undefined) return
  var 提示词 = await 计算类提示词(文件路径, 类名, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genClassPrompt(文件路径: string, 类名: string): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个类?' })
  if (要求 == undefined) return
  var 提示词 = await 计算类提示词(文件路径, 类名, 要求)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genCode(文件路径: string, 开始位置: number, 结束位置: number): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个片段?' })
  if (要求 == undefined) return
  var 提示词 = await 计算优化代码片段提示词(文件路径, 开始位置, 结束位置, 要求, false)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genCodePrompt(文件路径: string, 开始位置: number, 结束位置: number): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想怎样优化这个片段?' })
  if (要求 == undefined) return
  var 提示词 = await 计算优化代码片段提示词(文件路径, 开始位置, 结束位置, 要求, false)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}

export async function genQuestion(文件路径: string, 开始位置: number, 结束位置: number): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想问什么?' })
  if (要求 == undefined) return
  var 提示词 = await 计算优化代码片段提示词(文件路径, 开始位置, 结束位置, 要求, true)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框并发送', data: 提示词 })
}
export async function genQuestionPrompt(文件路径: string, 开始位置: number, 结束位置: number): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.files.save')
  const 要求 = await vscode.window.showInputBox({ placeHolder: '你想问什么?' })
  if (要求 == undefined) return
  var 提示词 = await 计算优化代码片段提示词(文件路径, 开始位置, 结束位置, 要求, true)
  var 侧边栏实例 = 侧边栏视图提供者.获得实例()
  await 侧边栏实例.postMessage({ command: '设置输入框', data: 提示词 })
}
