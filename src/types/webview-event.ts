export type webviewEventW2V =
  | {
      command: '调用AI'
      data: {
        角色: '用户' | 'AI'
        内容: string
      }[]
    }
  | {
      command: '应用到代码'
      data: string | null
    }
  | {
      command: '停止生成'
    }

export type webviewEventV2W =
  | {
      command: 'AI结果字符'
      data: string
    }
  | {
      command: 'AI调用结束'
    }
  | {
      command: '设置输入框'
      data: string
    }
  | {
      command: '设置输入框并发送'
      data: string
    }
