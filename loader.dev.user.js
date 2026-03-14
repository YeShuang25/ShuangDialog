// ==UserScript==
// @name         ShuangDialog Dev (本地开发)
// @namespace    http://tampermonkey.net/
// @version      1.0.0-dev
// @description  游戏聊天增强插件 - 本地开发版
// @author       YourName
// @match https://bondageprojects.elementfx.com/*
// @match https://www.bondageprojects.elementfx.com/*
// @match https://bondage-europe.com/*
// @match https://www.bondage-europe.com/*
// @match https://bondageprojects.com/*
// @match https://www.bondageprojects.com/*
// @match https://www.bondage-asia.com/club/R*
// @grant        none
// @run-at       document-end
// ==/UserScript==

console.log('[ShuangDialog Dev] 开始加载...');

// 注意：端口可能变化，请根据 npm run preview 的输出调整
const DEV_URL = 'http://localhost:3001/main.js';

async function loadPlugin() {
    try {
        console.log('[ShuangDialog Dev] 正在从本地服务器加载:', DEV_URL);
        const module = await import(DEV_URL);
        console.log('[ShuangDialog Dev] 模块加载成功:', module);
    } catch (error) {
        console.error('[ShuangDialog Dev] 加载失败:', error);
        console.error('[ShuangDialog Dev] 错误详情:', error.message);
        if (error.stack) {
            console.error('[ShuangDialog Dev] 堆栈:', error.stack);
        }
    }
}

loadPlugin();
