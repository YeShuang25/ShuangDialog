// ==UserScript==
// @name         ShuangDialog (霜语)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  游戏聊天增强插件
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

const supportedDomains = [
    'bondageprojects.elementfx.com',
    'bondage-europe.com',
    'bondageprojects.com',
    'bondage-asia.com'
];

const isSupportedDomain = supportedDomains.some(domain =>
    window.location.hostname.includes(domain)
);

if (isSupportedDomain) {
    console.log('[ShuangDialog] 正在加载插件...');
    const timestamp = Date.now();
    import(`https://yeshuang25.github.io/ShuangDialog/ShuangDialog.js?t=${timestamp}`);
} else {
    console.warn('[ShuangDialog] 当前页面不在支持的游戏域名内，跳过加载');
}
