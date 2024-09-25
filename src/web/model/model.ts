import * as uuid from 'uuid'

type 对话信息 = {
  id: string
  text: string
  isUser: boolean
}

export class 对话 {
  static 创建根节点(): 对话 {
    var c = new 对话('<对话根节点>', true)
    c._是根节点 = true
    return c
  }

  private id: string
  private 子节点: 对话[] = []
  private 父节点: 对话 | null = null
  private 子节点索引: number = NaN
  private _是根节点: boolean = false

  constructor(
    private text: string,
    private isUser: boolean,
  ) {
    this.id = uuid.v1()
  }

  async 添加子节点(a: 对话): Promise<void> {
    this.子节点.push(a)
    this.子节点索引 = this.子节点.length - 1
    a.父节点 = this
  }

  是根节点(): boolean {
    return this._是根节点
  }
  是用户节点(): boolean {
    return this.isUser
  }

  获得对话信息(): 对话信息 {
    return { id: this.id, text: this.text, isUser: this.isUser }
  }
  获得子节点个数(): number {
    return this.子节点.length
  }
  获得子节点索引(): number {
    return this.子节点索引
  }

  获得选择的子节点(): 对话 | null {
    return this.子节点[this.子节点索引] || null
  }
  获得当前最后节点(): 对话 {
    var 子节点 = this.获得选择的子节点()
    if (子节点 == null) return this
    return 子节点.获得当前最后节点()
  }
  获得节点链(): 对话[] {
    var 子节点 = this.获得选择的子节点()
    if (!子节点) return [this]
    return [this, ...子节点.获得节点链()]
  }

  获得父节点(): 对话 | null {
    return this.父节点
  }

  查找子节点(id: string): 对话 | null {
    if (this.id == id) return this
    var 子节点 = this.获得选择的子节点()
    if (子节点 == null) return null
    if (子节点.id == id) return 子节点
    return 子节点.查找子节点(id)
  }

  async 设置索引减(): Promise<void> {
    if (this.子节点索引 > 0) this.子节点索引--
  }
  async 设置索引加(): Promise<void> {
    if (this.子节点索引 < this.子节点.length - 1) this.子节点索引++
  }

  async 追加文本(新文本: string): Promise<void> {
    this.text += 新文本
  }

  生成AI调用提示词(): { 角色: '用户' | 'AI'; 内容: string }[] {
    var 节点链 = this.获得选择的子节点()?.获得节点链()
    if (!节点链) return []
    return 节点链.map((a) => ({ 角色: a.isUser ? '用户' : 'AI', 内容: a.text }))
  }

  获得最近的ts代码(): string | null {
    var 当前节点: 对话 | null = this.获得当前最后节点()

    while (当前节点 != null) {
      var match1 = 当前节点.text.match(/```(tsx)([\s\S]*?)```/)?.[2]
      if (match1) return match1.trim()

      var match2 = 当前节点.text.match(/```(ts|typescript)([\s\S]*?)```/)?.[2]
      if (match2) return match2.trim()

      当前节点 = 当前节点.获得父节点()
    }

    return null
  }
}
