class 基类 {
  名称: string

  constructor(名称: string) {
    this.名称 = 名称
  }

  打印名称(): void {
    console.log(`基类的名称是: ${this.名称}`)
  }
}

class 派生类 extends 基类 {
  描述: string

  constructor(名称: string, 描述: string) {
    super(名称)
    this.描述 = 描述
  }

  打印描述(): void {
    console.log(`派生类的描述是: ${this.描述}`)
  }
}
