// 版本管理配置
export const APP_VERSION = 'v2.13.6';

// 版本历史记录
export const VERSION_HISTORY = [
  {
    version: 'v2.13.6',
    date: '2026-03-23',
    description: '优化特别关注功能：从房间查询添加的玩家会直接显示名称（优先显示昵称）'
  },
  {
    version: 'v2.13.5',
    date: '2026-03-23',
    description: '特别关注功能增强：新增"查询房间"按钮，可获取当前房间内所有玩家列表，点击即可添加到特别关注'
  },
  {
    version: 'v2.13.4',
    date: '2026-03-23',
    description: '新增自动获取Chat ID功能：填写Bot Token后点击"获取"按钮，自动列出所有聊天记录，点击即可选择'
  },
  {
    version: 'v2.13.3',
    date: '2026-03-23',
    description: '优化Telegram消息排版：1.进入房间消息添加分割线；2.保留原始消息的中括号'
  },
  {
    version: 'v2.13.2',
    date: '2026-03-23',
    description: '优化Telegram消息排版：1.保留动作消息的括号；2.原始消息另起一行显示（斜体）；3.移除聊天消息开头的冒号'
  },
  {
    version: 'v2.13.1',
    date: '2026-03-23',
    description: '优化Telegram消息排版：1.移除聊天消息开头的冒号；2.移除动作消息的括号；3.统一消息类型emoji映射；4.添加私聊和悄悄话emoji'
  },
  {
    version: 'v2.13.0',
    date: '2026-03-22',
    description: 'Telegram功能增强：1.进入房间时发送带时间标签的通知（#日期_时间_房间名）；2.Bot自动删除用户发送的命令消息，保持聊天整洁；3.推荐使用群组并将Bot设为管理员'
  },
  {
    version: 'v2.12.0',
    date: '2026-03-21',
    description: 'Telegram远程命令功能：可通过Telegram发送命令控制游戏聊天。支持/say发送消息、/emote发送动作、/players查询房间玩家、/help查看帮助'
  },
  {
    version: 'v2.11.1',
    date: '2026-03-21',
    description: 'Telegram转发优化：1.修复消息内容为空的问题；2.新增筛选开关，可选择转发所有消息或仅转发筛选后的消息'
  },
  {
    version: 'v2.11.0',
    date: '2026-03-21',
    description: '新功能：添加Telegram消息转发功能。配置Telegram Bot后，可将霜语筛选的消息实时转发到Telegram个人或群组'
  },
  {
    version: 'v2.10.1',
    date: '2026-03-21',
    description: '优化与修复：1.修复定位按钮大小自适应问题（使用em单位跟随消息字体缩放）；2.修复全局关键字在句末无法匹配的bug（移除正则负向断言）；3.帮助界面改为独立切换模式，推荐设置可折叠展开；4.隐藏有bug的关闭霜语文本框按钮；5.修复设置特别关注界面的调整大小功能；6.优化窗口调整大小的拖动手感'
  },
  {
    version: 'v2.10.0',
    date: '2026-03-15',
    description: '重大更新：1.UI自适应窗口大小（标题栏、拖动条高度随游戏窗口缩放）；2.菜单重构为折叠式互斥展开；3.修复消息克隆丢失房间信息问题；4.新增消息类型过滤（对话/Emote/动作/其他），每个玩家可独立配置；5.设置弹窗可拖动且不阻塞游戏交互；6.修复目标玩家检测误匹配问题（使用正则精确匹配）；7.新增内容匹配功能（匹配玩家名字/昵称）；8.新增全局关键字匹配功能（独立于玩家配置）'
  },
  {
    version: 'v1.0',
    date: '2026-03-10',
    description: '初始版本 - 基础聊天窗口和悬浮球功能'
  },
  {
    version: 'v1.1',
    date: '2026-03-10',
    description: '修复调试模式日志输出问题，优化日志系统'
  },
  {
    version: 'v1.2',
    date: '2026-03-10',
    description: '添加BCEMsg内容过滤功能，减少日志噪音'
  },
  {
    version: 'v1.3',
    date: '2026-03-10',
    description: '添加Activity类型事件数据包下载功能'
  },
  {
    version: 'v1.4',
    date: '2026-03-11',
    description: '添加聊天对话框监控功能，支持消息变化监控和日志输出'
  },
  {
    version: 'v1.5',
    date: '2026-03-11',
    description: '修复聊天监控功能，支持Activity类型消息的正确解析'
  },
  {
    version: 'v1.6',
    date: '2026-03-11',
    description: '优化聊天监控功能，只监控ChatMessageChat类型的消息'
  },
  {
    version: 'v1.7',
    date: '2026-03-11',
    description: '添加聊天框导出功能，支持导出为HTML文件'
  },
  {
    version: 'v1.8',
    date: '2026-03-11',
    description: '优化聊天框导出功能，改进HTML格式化和可读性'
  },
  {
    version: 'v1.9',
    date: '2026-03-12',
    description: '更新版本号至v1.9'
  },
  {
    version: 'v1.10',
    date: '2026-03-12',
    description: '修复导出功能，支持原始消息内容的导出'
  },
  {
    version: 'v1.11',
    date: '2026-03-12',
    description: '重构导出功能，使用原始HTML结构保留完整信息'
  },
  {
    version: 'v1.12',
    date: '2026-03-12',
    description: '优化导出功能，添加成功提示通知'
  },
  {
    version: 'v2.0',
    date: '2026-03-12',
    description: '重构UI界面，简化悬浮球，删除聊天界面，改为菜单栏模式'
  },
  {
    version: 'v2.1',
    date: '2026-03-12',
    description: '修复聊天导出功能：解决时间和玩家ID贴在一起的问题，移除私聊末尾的多余信息，保留玩家名字颜色'
  },
  {
    version: 'v2.2',
    date: '2026-03-12',
    description: '增强聊天导出功能：为玩家名字添加黑色描边解决白色文字与背景重叠问题，添加暗色模式支持，优化原始内容对齐排版'
  },
  {
    version: 'v2.3',
    date: '2026-03-12',
    description: '优化聊天导出：调整玩家名字粗细，暗色模式下描边改为白色，添加隐私消息过滤选项（悄悄话和私聊）'
  },
  {
    version: 'v2.4',
    date: '2026-03-12',
    description: '优化字体样式：进一步减小玩家名字粗细，增大整体字体大小，提升可读性'
  },
  {
    version: 'v2.5',
    date: '2026-03-12',
    description: '优化字体样式：进一步减小玩家名字粗细至300，增大所有字体大小（玩家名16px，内容16px，原始内容15px），解决笔画拥挤问题'
  },
  {
    version: 'v2.6',
    date: '2026-03-12',
    description: '大幅优化字体显示：增大字号（玩家名18px，内容18px，原始内容16px），使用更精细的0.5px描边替代1px描边，增加8方向阴影使描边更均匀，解决白色文字与背景重叠问题'
  },
  {
    version: 'v2.7',
    date: '2026-03-13',
    description: '新增霜语文本框功能：在菜单中添加开关选项，开启后在游戏文本框上方显示霜语文本框，占用原文本框高度的1/3，为后续消息筛选功能做准备'
  },
  {
    version: 'v2.7.1',
    date: '2026-03-13',
    description: '修复霜语文本框：改用CSS样式注入方式调整游戏文本框位置，添加调试日志，移除可能导致无限循环的MutationObserver'
  },
  {
    version: 'v2.7.2',
    date: '2026-03-13',
    description: '修复无限循环bug：移除ResizeObserver，只在开启时捕获一次原始位置，使用isInitializedRef防止重复初始化'
  },
  {
    version: 'v2.7.3',
    date: '2026-03-13',
    description: '修复游戏文本框高度不改变问题：直接操作元素style属性而非CSS注入；添加窗口resize监听，支持窗口大小改变时自动适配'
  },
  {
    version: 'v2.7.4',
    date: '2026-03-13',
    description: '重构霜语文本框：使用createPortal将组件插入到#chat-room-div内部，使用flex布局和order属性控制显示顺序，继承游戏样式管理'
  },
  {
    version: 'v2.7.5',
    date: '2026-03-13',
    description: '修复显示顺序：给输入框#chat-room-bot添加order:3，确保顺序为：霜语文本框(order:1) > 游戏文本框(order:2) > 输入框(order:3)'
  },
  {
    version: 'v2.7.6',
    date: '2026-03-13',
    description: '修复两个问题：1.使用flex比例替代固定百分比，让输入框高度不被压缩；2.使用:not([hidden])选择器避免覆盖hidden属性，添加MutationObserver同步隐藏状态'
  },
  {
    version: 'v2.7.7',
    date: '2026-03-13',
    description: '霜语文本框功能增强：1.关闭时仅隐藏组件而非删除；2.标题改为霜语；3.添加拖拽调整高度功能，支持用户自定义霜语和游戏文本框占比（10%-90%）'
  },
  {
    version: 'v2.7.8',
    date: '2026-03-13',
    description: '修复霜语文本框拖拽高度调整问题：使用直接DOM操作实现实时同步更新霜语和游戏文本框高度'
  },
  {
    version: 'v2.7.9',
    date: '2026-03-13',
    description: '优化霜语文本框：1.使用ref直接引用容器元素；2.延迟更新flex样式确保DOM渲染完成；3.添加详细调试日志'
  },
  {
    version: 'v2.7.10',
    date: '2026-03-13',
    description: '修复霜语高度问题：优化容器内部flex布局，确保内容区域能正确占满空间'
  },
  {
    version: 'v2.7.11',
    date: '2026-03-13',
    description: '修复拖拽条位置：将拖拽条移至霜语内容区域和游戏文本框之间'
  },
  {
    version: 'v2.7.12',
    date: '2026-03-13',
    description: '重写霜语文本框：简化结构，直接在portal容器上设置flex，确保拖拽调整高度功能正常工作'
  },
  {
    version: 'v2.7.13',
    date: '2026-03-13',
    description: '优化调试系统：1.创建调试配置文件控制日志输出；2.修复关闭霜语后游戏文本框高度未恢复的问题'
  },
  {
    version: 'v2.7.14',
    date: '2026-03-13',
    description: '修复关闭霜语后游戏文本框高度无限延长的问题：保存并恢复游戏文本框的原始高度值'
  },
  {
    version: 'v2.7.15',
    date: '2026-03-13',
    description: '优化霜语内容区域：移除占位提示文本，添加min-height确保内容区域不会被压缩；默认打开霜语'
  },
  {
    version: 'v2.7.16',
    date: '2026-03-13',
    description: '修复登录界面初始化失败问题：添加DOM监听器，等待聊天框组件出现后再初始化霜语'
  },
  {
    version: 'v2.8.0',
    date: '2026-03-13',
    description: '重大更新：实现特别关注玩家功能。1.创建消息状态管理；2.创建消息筛选器；3.创建用户配置管理；4.更新霜语UI显示筛选后的消息；5.添加玩家ID配置界面'
  },
  {
    version: 'v2.8.1',
    date: '2026-03-13',
    description: '修复v2.8.0的bug：1.修复拖动高度时重复添加消息的问题（分离消息筛选器启动逻辑和高度调整逻辑）；2.改进消息显示方式，直接克隆整个消息元素保留原始样式和功能；3.添加消息ID去重机制'
  },
  {
    version: 'v2.8.2',
    date: '2026-03-13',
    description: '修复消息筛选器无法获取消息的问题：1.将MutationObserver的subtree改为true；2.添加详细调试日志帮助诊断问题'
  },
  {
    version: 'v2.8.3',
    date: '2026-03-13',
    description: '修复消息筛选器启动问题：1.修复聊天框延迟出现时messageFilter.start()未被调用的问题；2.将所有调试日志改为console.log确保输出；3.添加更多调试信息'
  },
  {
    version: 'v2.8.4',
    date: '2026-03-13',
    description: '修复三个关键问题：1.修复霜语隐藏后游戏聊天框高度未恢复的问题（添加display:block样式）；2.修复拖动高度时重复添加消息的问题（使用正则替换CSS而非重新生成）；3.修复reply按钮失灵的问题（使用DOM操作替代dangerouslySetInnerHTML）'
  },
  {
    version: 'v2.8.5',
    date: '2026-03-13',
    description: '修复多个问题：1.修复拖动条占用大量位置的问题（优化CSS替换逻辑）；2.修复重开霜语后内容消失的问题（添加chatBoxEnabled依赖触发渲染）；3.修复重开时重复添加消息的问题（停止时不清空messageIdSet）；4.修复reply按钮失灵的问题（为克隆按钮重新绑定点击事件，转发到原始按钮）'
  },
  {
    version: 'v2.8.6',
    date: '2026-03-14',
    description: '修复多个问题：1.修复霜语隐藏后游戏聊天框无限延长的问题（使用getComputedStyle获取实际高度，关闭时直接设置style.height）；2.修复reply按钮不起作用的问题（添加preventDefault和stopPropagation）；3.修复霜语字体大小不随窗口缩放的问题（使用em单位继承父元素字体大小）；4.实现目标玩家相关的消息筛选功能（检测活动消息中是否包含关注玩家的名字）'
  },
  {
    version: 'v2.8.7',
    date: '2026-03-14',
    description: '新增功能：在霜语标题栏添加字体倍数调整功能。玩家可以通过输入框调整字体大小倍数（0.5-2.0），该倍数会在原有字体大小基础上进行缩放，设置会自动保存到本地存储'
  },
  {
    version: 'v2.8.8',
    date: '2026-03-14',
    description: '修复两个关键问题：1.修复隐藏霜语后游戏文本框折叠的问题（优化高度获取逻辑，优先使用内联高度或计算高度）；2.修复游戏文本框重新显示时滚动条不定位到底部的问题（监听hidden属性变化，重新显示时自动滚动到底部）'
  },
  {
    version: 'v2.8.9',
    date: '2026-03-14',
    description: '修复隐藏霜语后游戏文本框折叠的问题：正确解析calc()格式的高度值（如calc(466.472px)），提取实际像素值用于恢复高度'
  },
  {
    version: 'v2.8.10',
    date: '2026-03-14',
    description: '修复隐藏霜语后游戏文本框折叠的问题：隐藏霜语时清除portal容器的flex样式，避免影响游戏文本框高度计算'
  },
  {
    version: 'v2.9.0',
    date: '2026-03-14',
    description: '重构霜语折叠逻辑：移除隐藏功能，改为允许用户将霜语拖动到最小高度（2%），此时标题栏和内容区域自动隐藏，只保留拖动条方便用户重新展开；拖动条高度增加到10px并添加视觉提示'
  },
  {
    version: 'v2.9.1',
    date: '2026-03-14',
    description: '更新README文档：按照安装教程-功能介绍-开发相关的顺序重新组织文档结构，添加霜语文本框、特别关注、聊天记录导出等功能的详细说明'
  },
  {
    version: 'v2.9.2',
    date: '2026-03-14',
    description: '修复特别关注自己的问题：跳过bce-pending类（正在发送中）的消息，避免霜语监控未发送完成的消息导致游戏文本框中的消息无法正常消失'
  },
  {
    version: 'v2.9.3',
    date: '2026-03-14',
    description: '优化字体倍数输入框宽度：从45px增加到60px，确保0.5这样的数字能够完整显示'
  }
];

// 获取当前版本信息
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    buildDate: new Date().toISOString().split('T')[0],
    history: VERSION_HISTORY
  };
}