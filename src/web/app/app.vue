<template>
  <div style="margin: 0; padding: 0; height: 100vh; display: flex; flex-direction: column">
    <!-- 滚动区域 -->
    <div
      ref="v_滚动区域HTML元素"
      style="flex: 1; overflow-y: auto; padding: 10px; box-sizing: border-box"
      @scroll="v_handleScroll"
    >
      <!-- 对话消息部分 -->
      <div
        v-for="message in v_对话"
        :key="message.id"
        :style="{
          display: 'flex',
          marginBottom: '10px',
          position: 'relative',
          justifyContent: message.isUser ? 'flex-end' : 'flex-start',
        }"
        @mouseover="v_setEditButton(message.id, true)"
        @mouseleave="v_setEditButton(message.id, false)"
      >
        <!-- 编辑按钮 -->
        <button
          v-if="message.showEditButton"
          @click="v_startEditing(message)"
          style="
            position: absolute;
            top: 0;
            background-color: #007bff;
            color: #fff;
            border: none;
            padding: 5px;
            cursor: pointer;
          "
        >
          编辑
        </button>

        <div
          style="
            border: 1px solid #ccc;
            padding: 10px 15px;
            border-radius: 10px;
            max-width: 85%;
            background-color: transparent;
            word-break: break-all;
            white-space: pre-wrap;
          "
        >
          {{ message.text }}
          <!-- 如果有编辑记录，显示导航按钮 -->
          <div v-if="message.maxIndex > 1">
            <button @click="v_previousEdit(message)" :disabled="message.nowIndex <= 0">上一个</button>
            <span>{{ message.nowIndex + 1 }}/{{ message.maxIndex }}</span>
            <button @click="v_nextEdit(message)" :disabled="message.nowIndex + 1 >= message.maxIndex">下一个</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 按钮部分 -->
    <div style="padding: 10px; box-sizing: border-box; display: flex; justify-content: space-between">
      <button style="padding: 8px 16px" @click="v_clearMessages" v-if="v_页面状态 == '正常'">清空聊天</button>
      <button style="padding: 8px 16px" @click="v_regenerateMessage" v-if="v_页面状态 == '正常'">重新生成</button>
      <button style="padding: 8px 16px" @click="v_applyCode" v-if="v_页面状态 == '正常'">应用到代码</button>
      <button style="padding: 8px 16px; width: 100%" @click="v_stopGen" v-if="v_页面状态 == '等待'">停止生成</button>
    </div>

    <!-- 输入框部分 -->
    <div style="padding: 10px; padding-top: 0px; box-sizing: border-box; display: flex">
      <textarea
        v-model="v_输入框数据"
        placeholder="在此输入..."
        style="flex: 1; padding: 8px; box-sizing: border-box; overflow-y: auto; resize: none"
        @keydown.enter.prevent="v_handleEnter"
        ref="v_输入框HTML元素"
      ></textarea>
    </div>

    <!-- 编辑对话框 -->
    <div
      v-if="v_正在编辑的信息"
      style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        border: 1px solid #ccc;
        padding: 20px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      "
    >
      <h3>编辑对话</h3>
      <textarea v-model="v_编辑框数据" style="width: 100%; height: 100px"></textarea>
      <div style="margin-top: 10px; display: flex; justify-content: space-between">
        <button @click="v_saveEdit" style="padding: 8px 16px">保存</button>
        <button @click="v_cancelEdit" style="padding: 8px 16px">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, Ref, ref, watch } from 'vue'
import { webviewEventV2W, webviewEventW2V } from '../../types/webview-event.js'
import { 对话 } from '../model/model.js'

type v_对话类型 = {
  id: string
  text: string
  isUser: boolean
  showEditButton: boolean
  maxIndex: number
  nowIndex: number
}

declare var acquireVsCodeApi: () => { postMessage: (data: webviewEventW2V) => void }
var vscode = acquireVsCodeApi()
var 对话根节点 = 对话.创建根节点()
var 输入框最大高度 = 120

var v_对话: Ref<v_对话类型[]> = ref([])
var v_输入框HTML元素 = ref<HTMLTextAreaElement | null>(null)
var v_滚动区域HTML元素 = ref<HTMLTextAreaElement | null>(null)
var v_输入框数据 = ref('')
var v_滚动条在底部 = ref(true)
var v_正在编辑的信息 = ref<v_对话类型 | null>(null)
var v_编辑框数据 = ref('')
var v_页面状态: Ref<'正常' | '等待'> = ref('正常')
// todo 丑陋的全局变量
var v_重生成模式: Ref<boolean> = ref(false)

window.addEventListener('message', async (event) => {
  var data = event.data as webviewEventV2W

  switch (data.command) {
    case 'AI结果字符': {
      var 最后节点 = 对话根节点.获得当前最后节点()
      if (最后节点.是用户节点()) {
        await 最后节点.添加子节点(new 对话('', false))
        最后节点 = 对话根节点.获得当前最后节点()
      } else if (v_重生成模式.value == true) {
        await 最后节点.获得父节点()?.添加子节点(new 对话('', false))
        最后节点 = 对话根节点.获得当前最后节点()
        v_重生成模式.value = false
      }
      await 最后节点.追加文本(data.data)
      await v_刷新v对话()
      return
    }
    case 'AI调用结束': {
      v_页面状态.value = '正常'
      return
    }
    case '设置输入框': {
      v_输入框数据.value = data.data
      await nextTick()
      await v_adjustHeight()
      v_输入框部分滚动条滚到底部()
      return
    }
    case '设置输入框并发送': {
      await v_clearMessages()
      v_输入框数据.value = data.data
      await nextTick()
      await v_adjustHeight()
      await v_sendMessage()
      await v_adjustHeight()
      return
    }
  }

  var _类型检查: never = data
})

onMounted(async () => (v_输入框HTML元素.value ? v_adjustHeight() : null))
watch(v_输入框数据, async () => v_adjustHeight())
watch(v_对话, async () => {
  await nextTick()
  v_对话部分滚动条滚到底部()
})

async function 发送AI调用() {
  v_页面状态.value = '等待'
  var data = 对话根节点.生成AI调用提示词()
  if (v_重生成模式.value == true) data.pop()
  vscode.postMessage({ command: '调用AI', data })
}

function 生成v对话(对话: 对话): v_对话类型[] {
  if (对话.是根节点()) {
    var 子节点 = 对话.获得选择的子节点()
    return 子节点 ? 生成v对话(子节点) : []
  }

  var 对话信息 = 对话.获得对话信息()
  var 本层子节点个数 = 对话.获得子节点个数()
  var 上层子节点个数 = 对话.获得父节点()?.获得子节点个数()
  var 上层子节点索引 = 对话.获得父节点()?.获得子节点索引()

  if (上层子节点个数 == null || 上层子节点索引 == null) {
    throw new Error('意外的数组越界')
  }

  var 当前节点 = {
    id: 对话信息.id,
    text: 对话信息.text,
    isUser: 对话信息.isUser,
    showEditButton: false,
    maxIndex: 上层子节点个数,
    nowIndex: 上层子节点索引,
  }

  if (本层子节点个数 == 0) return [当前节点]

  var 下一跳 = 对话.获得选择的子节点()
  if (下一跳 == null) throw new Error('意外的数组越界')
  return [当前节点, ...生成v对话(下一跳)]
}

function v_对话部分滚动条滚到底部() {
  if (v_滚动条在底部.value && v_滚动区域HTML元素.value) {
    v_滚动区域HTML元素.value.scrollTop = v_滚动区域HTML元素.value.scrollHeight
  }
}
function v_输入框部分滚动条滚到底部() {
  if (v_输入框HTML元素.value) v_输入框HTML元素.value.scrollTop = v_输入框HTML元素.value.scrollHeight
}
async function v_刷新v对话() {
  v_对话.value = 生成v对话(对话根节点)
}
async function v_插入消息(内容: string, 是用户: boolean): Promise<void> {
  var 最后节点 = 对话根节点.获得当前最后节点()
  await 最后节点.添加子节点(new 对话(内容, 是用户))
  await v_刷新v对话()
}

var v_sendMessage = async () => {
  if (v_页面状态.value != '正常') return
  if (v_输入框数据.value.trim() !== '') {
    await v_插入消息(v_输入框数据.value, true)
    v_输入框数据.value = ''
    await 发送AI调用()
  }
}
var v_regenerateMessage = async () => {
  if (v_页面状态.value != '正常') return
  var 最后节点 = 对话根节点.获得当前最后节点()
  if (最后节点.是用户节点()) return await 发送AI调用()
  v_重生成模式.value = true
  await 发送AI调用()
}
var v_clearMessages = async () => {
  if (v_页面状态.value != '正常') return
  对话根节点 = 对话.创建根节点()
  await v_刷新v对话()
}
var v_applyCode = async () => {
  vscode.postMessage({ command: '应用到代码', data: 对话根节点.获得最近的ts代码() })
}
var v_stopGen = async () => {
  vscode.postMessage({ command: '停止生成' })
}

var v_setEditButton = async (id: string, show: boolean) => {
  if (v_页面状态.value != '正常') return
  var 目标 = v_对话.value.find((a) => a.id == id)
  if (!目标) return
  目标.showEditButton = show
}
var v_startEditing = async (message: v_对话类型) => {
  if (v_页面状态.value != '正常') return
  v_正在编辑的信息.value = message
  v_编辑框数据.value = message.text
}
var v_cancelEdit = async () => {
  if (v_页面状态.value != '正常') return
  v_正在编辑的信息.value = null
  v_编辑框数据.value = ''
}
var v_saveEdit = async () => {
  if (v_页面状态.value != '正常') return
  if (v_正在编辑的信息.value && v_编辑框数据.value) {
    var 父节点 = 对话根节点.查找子节点(v_正在编辑的信息.value.id)?.获得父节点()

    if (!父节点) return

    await 父节点.添加子节点(new 对话(v_编辑框数据.value, v_正在编辑的信息.value.isUser))
    await v_刷新v对话()

    if (v_正在编辑的信息.value.isUser) await 发送AI调用()

    v_正在编辑的信息.value = null
    v_编辑框数据.value = ''
  }
}

var v_previousEdit = async (message: v_对话类型) => {
  if (v_页面状态.value != '正常') return
  var 父节点 = 对话根节点.查找子节点(message.id)?.获得父节点()
  if (!父节点) return
  await 父节点.设置索引减()
  await v_刷新v对话()
}
var v_nextEdit = async (message: v_对话类型) => {
  if (v_页面状态.value != '正常') return
  var 父节点 = 对话根节点.查找子节点(message.id)?.获得父节点()
  if (!父节点) return
  await 父节点.设置索引加()
  await v_刷新v对话()
}

var v_handleScroll = () => {
  if (v_滚动区域HTML元素.value) {
    var { scrollTop, scrollHeight, clientHeight } = v_滚动区域HTML元素.value
    v_滚动条在底部.value = Math.abs(scrollHeight - scrollTop - clientHeight) < 1
  }
}
var v_adjustHeight = async () => {
  if (v_输入框HTML元素.value) {
    v_输入框HTML元素.value.style.height = '0px'
    if (v_输入框HTML元素.value.scrollHeight > 输入框最大高度) {
      v_输入框HTML元素.value.style.overflow = 'auto'
      v_输入框HTML元素.value.style.height = 输入框最大高度 + 'px'
    } else {
      v_输入框HTML元素.value.style.overflow = 'hidden'
      v_输入框HTML元素.value.style.height = v_输入框HTML元素.value.scrollHeight + 'px'
    }
  }
}
var v_handleEnter = async (event: KeyboardEvent) => {
  event.preventDefault()
  var 输入框元素 = v_输入框HTML元素.value
  if (输入框元素) {
    var 存在的输入框元素 = 输入框元素
    if (event.shiftKey && event.key == 'Enter') {
      var start = 存在的输入框元素.selectionStart
      var end = 存在的输入框元素.selectionEnd
      v_输入框数据.value = v_输入框数据.value.substring(0, start) + '\n' + v_输入框数据.value.substring(end)
      await nextTick()
      存在的输入框元素.selectionStart = 存在的输入框元素.selectionEnd = start + 1
      v_输入框部分滚动条滚到底部()
      await v_adjustHeight()
    } else if (event.key == 'Enter') {
      await v_sendMessage()
      await nextTick()
      v_对话部分滚动条滚到底部()
      await v_adjustHeight()
    }
  }
}
</script>
