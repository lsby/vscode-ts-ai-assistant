import { 枚举类型 } from '../type/type.js'

export class 基类 {
  名称: 枚举类型 = 枚举类型.蓝色
}

export class 派生类 extends 基类 {
  f(): void {}
}
