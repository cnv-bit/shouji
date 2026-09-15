import {
    onChatChanged,
    onChatDeleted,
    onGroupChatDeleted,
    onMessageReceived,
} from '../integration/event-bridge.js';
import { resolveCurrentHostIdentity } from '../integration/chat-identity.js';
import { createHostChatDeletedFact } from '../qq-v2/host/lifecycle.js';
import { Logger, handleError } from '../error-handler.js';
import {
    DOM_IDS,
    syncPhoneToggleVisualStyle,
    resetPhoneTogglePosition,
    applyPhoneTogglePosition,
} from './toggle-button.js';

function dispatchQQV2Event(callback, eventName, ...args) {
    if (typeof callback !== 'function') return;

    try {
        void Promise.resolve(callback(...args)).catch((error) => {
            Logger.warn(`QQ v2 ${eventName}处理失败`, error);
        });
    } catch (error) {
        Logger.warn(`QQ v2 ${eventName}处理失败`, error);
    }
}

export async function registerPhoneEventListeners(options = {}) {
    const {
        onQQV2ChatChanged,
        onQQV2ChatDeleted,
        onQQV2GroupChatDeleted,
        onQQV2MessageReceived,
        resolveQQV2HostIdentity = resolveCurrentHostIdentity,
    } = options;

    try {
        await onChatChanged((chatId) => {
            Logger.info('聊天切换:', chatId);
            dispatchQQV2Event(onQQV2ChatChanged, '聊天切换', chatId);
        });

        await onChatDeleted((chatFile) => {
            const identity = resolveQQV2HostIdentity?.();
            const fact = createHostChatDeletedFact('character', chatFile, {
                hostId: identity?.hostType === 'character' ? identity.hostId : '',
            });
            Logger.info('私聊聊天删除:', fact);
            dispatchQQV2Event(onQQV2ChatDeleted, '私聊聊天删除', fact);
        });

        await onGroupChatDeleted((chatId) => {
            const identity = resolveQQV2HostIdentity?.();
            const fact = createHostChatDeletedFact('group', chatId, {
                hostId: identity?.hostType === 'group' ? identity.hostId : '',
            });
            Logger.info('群聊聊天删除:', fact);
            dispatchQQV2Event(onQQV2GroupChatDeleted, '群聊聊天删除', fact);
        });

        await onMessageReceived((messageId, generationType) => {
            Logger.debug('角色消息已写入正文:', messageId, generationType);
            dispatchQQV2Event(onQQV2MessageReceived, '正文角色消息写入', messageId, generationType);
        });

        Logger.debug('事件监听器已注册');
    } catch (error) {
        handleError(error, '注册事件监听器失败');
    }
}

export function bindPhoneBootstrapWindowEvents(eventManager) {
    if (!eventManager || typeof eventManager.add !== 'function') {
        return;
    }

    const handleToggleStyleUpdated = () => {
        syncPhoneToggleVisualStyle();
    };

    const handleTogglePositionReset = () => {
        resetPhoneTogglePosition();
    };

    const handleViewportResize = () => {
        const btn = document.getElementById(DOM_IDS.toggle);
        if (!btn) return;
        applyPhoneTogglePosition(btn, { persistIfAdjusted: true });
    };

    eventManager.add(window, 'yuzi-phone-toggle-style-updated', handleToggleStyleUpdated);
    eventManager.add(window, 'yuzi-phone-toggle-position-reset', handleTogglePositionReset);
    eventManager.add(window, 'resize', handleViewportResize);
}
