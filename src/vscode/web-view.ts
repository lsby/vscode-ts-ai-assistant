import * as vscode from 'vscode'
import { 全局变量 } from '../global/global'
import { webviewEventV2W, webviewEventW2V } from '../types/webview-event'

export class 侧边栏视图提供者 implements vscode.WebviewViewProvider {
  public static readonly 视图id = `${全局变量.插件名称}-sidebar`

  private static 实例: 侧边栏视图提供者 | null = null
  static 获得实例(): 侧边栏视图提供者 {
    if (!全局变量.扩展目录) throw new Error('没有找到扩展目录')

    if (!侧边栏视图提供者.实例) {
      侧边栏视图提供者.实例 = new 侧边栏视图提供者(全局变量.扩展目录)
    }
    return 侧边栏视图提供者.实例
  }

  private 视图: vscode.WebviewView | null = null
  private extensionUri: vscode.Uri
  private event = async (_message: webviewEventW2V): Promise<void> => {}

  private constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri
  }

  async setEvent(event: (message: webviewEventW2V) => Promise<void>): Promise<void> {
    this.event = event
  }
  async postMessage(data: webviewEventV2W): Promise<void> {
    var webview = this.视图?.webview
    if (!webview) {
      void vscode.window.showInformationMessage('视图还没有初始化')
      throw new Error('视图还没有初始化')
    }
    await webview.postMessage(data)
  }

  getWebView(): vscode.Webview | null {
    return this.视图?.webview || null
  }

  public resolveWebviewView(
    视图: vscode.WebviewView,
    _上下文: vscode.WebviewViewResolveContext,
    _取消标记: vscode.CancellationToken,
  ): void {
    this.视图 = 视图

    视图.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }

    var scriptUri = 视图.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'web', 'index.js'))
    视图.webview.html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="${scriptUri}" defer></script>
    </head>
    <body>
      <div id="app"></div>
    </body>
    `

    视图.webview.onDidReceiveMessage(async (message) => {
      await this.event(message)
    })
  }
}
