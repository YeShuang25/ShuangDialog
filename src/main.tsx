import { initCore } from './core/socket';
import { initChatMonitor } from './core/chatMonitor';
import { createRoot } from 'react-dom/client';
import { MiniFloatingBall } from './ui/components/MiniFloatingBall';
import { ShuangChatBox } from './ui/components/ShuangChatBox';
import './ui/style.css';
import { initUserStore, watchLoginStatus, migrateOldConfig } from './store/useUserStore';
import { useShuangConfigStore } from './store/useShuangConfigStore';
import { useTelegramStore } from './store/useTelegramStore';
import { ScaleProvider } from './ui/context/ScaleContext';

function main() {
  initCore();
  initChatMonitor();
  
  const container = document.createElement('div');
  container.id = 'shuang-dialog-root';
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(
    <ScaleProvider>
      <MiniFloatingBall />
      <ShuangChatBox />
    </ScaleProvider>
  );
  
  console.log('[ShuangDialog] 插件已启动');
}

async function initApp() {
  const userId = await initUserStore();
  
  if (userId) {
    migrateOldConfig(userId);
    useShuangConfigStore.getState().loadUserConfig();
  }
  
  useTelegramStore.getState().loadConfig();
  
  main();
  
  watchLoginStatus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
