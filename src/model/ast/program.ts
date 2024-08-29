import path from 'path'
import ts from 'typescript'
import { 是dts文件, 获得源文件们 } from './source-file'

export function 创建程序(tsconfig路径: string, types路径: string): ts.Program {
  const tsconfig内容 = ts.readConfigFile(tsconfig路径, ts.sys.readFile)
  const tsconfig解析结果 = ts.parseJsonConfigFileContent(tsconfig内容.config, ts.sys, path.dirname(tsconfig路径))
  return ts.createProgram(tsconfig解析结果.fileNames, {
    ...tsconfig解析结果.options,
    typeRoots: [types路径],
  })
}
export function 获得类型检查器(a: ts.Program): ts.TypeChecker {
  return a.getTypeChecker()
}
/**
 * 可以使用 {@link 获得源文件们}
 * 注意将传入路径和源文件路径都做标准化处理, 使用path模块
 */
export function 按路径选择源文件(目标路径: string, a: ts.Program): ts.SourceFile | null {
  const 源文件们 = 获得源文件们(a)
  const 标准化目标路径 = path.normalize(目标路径)

  for (const 源文件 of 源文件们) {
    if (是dts文件(源文件)) continue
    const 标准化源文件路径 = path.normalize(源文件.fileName)
    if (标准化源文件路径 === 标准化目标路径) {
      return 源文件
    }
  }

  return null
}
