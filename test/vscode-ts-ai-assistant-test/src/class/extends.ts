import { 枚举类型 } from '../type/type.js'

class 基类 {
  名称: 枚举类型 = 枚举类型.蓝色
}

class 派生类 extends 基类 {
  f(): void {}
}
