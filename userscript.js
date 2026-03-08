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
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 配置信息
    const CONFIG = {
        // GitHub Pages 部署的编译后的文件URL
        BUNDLE_URL: 'https://yeshuang25.github.io/ShuangDialog/main.js',
        // 版本号，用于缓存控制
        VERSION: '1.0.0',
        // 重试次数
        RETRY_COUNT: 3,
        // 重试间隔（毫秒）
        RETRY_DELAY: 2000
    };

    // 日志工具
    const Logger = {
        log: function(msg, data) {
            console.log(`[ShuangDialog Loader] ${msg}`, data || '');
        },
        error: function(msg, error) {
            console.error(`[ShuangDialog Loader] ${msg}`, error || '');
        },
        warn: function(msg, data) {
            console.warn(`[ShuangDialog Loader] ${msg}`, data || '');
        }
    };

    // 加载脚本
    function loadScript(url, retryCount = 0) {
        return new Promise((resolve, reject) => {
            Logger.log(`正在加载脚本: ${url} (尝试 ${retryCount + 1}/${CONFIG.RETRY_COUNT})`);
            
            GM_xmlhttpRequest({
                method: 'GET',
                url: url + `?v=${CONFIG.VERSION}`,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            // 执行脚本
                            const script = document.createElement('script');
                            script.textContent = response.responseText;
                            script.id = 'shuang-dialog-bundle';
                            document.head.appendChild(script);
                            
                            Logger.log('脚本加载并执行成功');
                            resolve(response.responseText);
                        } catch (error) {
                            Logger.error('脚本执行失败:', error);
                            reject(error);
                        }
                    } else {
                        Logger.error(`脚本加载失败，状态码: ${response.status}`);
                        reject(new Error(`HTTP ${response.status}`));
                    }
                },
                onerror: function(error) {
                    Logger.error('网络请求失败:', error);
                    reject(error);
                },
                ontimeout: function() {
                    Logger.error('请求超时');
                    reject(new Error('Timeout'));
                },
                timeout: 10000
            });
        });
    }

    // 重试加载
    async function loadWithRetry() {
        for (let i = 0; i < CONFIG.RETRY_COUNT; i++) {
            try {
                await loadScript(CONFIG.BUNDLE_URL, i);
                return;
            } catch (error) {
                Logger.warn(`第 ${i + 1} 次加载失败:`, error);
                
                if (i < CONFIG.RETRY_COUNT - 1) {
                    Logger.log(`等待 ${CONFIG.RETRY_DELAY}ms 后重试...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                }
            }
        }
        
        Logger.error('所有重试都失败了，插件加载终止');
        
        // 显示错误提示
        showErrorNotification();
    }

    // 显示错误通知
    function showErrorNotification() {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('ShuangDialog 加载失败', {
                body: '无法加载聊天增强插件，请检查网络连接或联系开发者。',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMSAxN0gxM1YxMUgxM1YxN1pNMTMgOUgxMVY3SDEzVjlaIiBmaWxsPSIjNzc3Ii8+Cjwvc3ZnPgo='
            });
        }
        
        // 在页面上显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = 'ShuangDialog 加载失败，请刷新页面重试';
        document.body.appendChild(errorDiv);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // 检查是否已经加载
    function isAlreadyLoaded() {
        return document.getElementById('shuang-dialog-bundle') !== null ||
               document.getElementById('shuang-dialog-root') !== null;
    }

    // 主函数
    async function main() {
        try {
            // 检查是否已经加载
            if (isAlreadyLoaded()) {
                Logger.log('ShuangDialog 已经加载，跳过');
                return;
            }

            // 检查是否在正确的游戏页面
            if (!window.location.hostname.includes('your-game-domain.com')) {
                Logger.warn('当前页面不在支持的游戏域名内');
                return;
            }

            // 等待DOM加载完成
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }

            // 加载主脚本
            await loadWithRetry();
            
        } catch (error) {
            Logger.error('主函数执行失败:', error);
            showErrorNotification();
        }
    }

    // 启动
    Logger.log('ShuangDialog Loader 启动');
    main();

})();
