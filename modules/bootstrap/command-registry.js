import { Logger } from '../error-handler.js';
import { defaultSettings, extensionName } from '../settings.js';
import { DOM_IDS, resetPhoneTogglePosition } from './toggle-button.js';

const logger = Logger.withScope({ scope: 'bootstrap/command-registry', feature: 'slash' });

function getPhoneContainer() {
    return document.getElementById(DOM_IDS.container);
}

function getPhoneToggle() {
    return document.getElementById(DOM_IDS.toggle);
}

function parseSettingsImportPayload(rawPayload) {
    try {
        const parsed = JSON.parse(String(rawPayload || ''));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return { ok: false, message: '设置导入失败：JSON 须为对象' };
        }

        const namespacePayload = parsed[extensionName];
        if (namespacePayload !== undefined) {
            if (!namespacePayload || typeof namespacePayload !== 'object' || Array.isArray(namespacePayload)) {
                return { ok: false, message: `设置导入失败：${extensionName} 必须是对象` };
            }
            return { ok: true, payload: namespacePayload };
        }

        return { ok: true, payload: parsed };
    } catch (error) {
        return {
            ok: false,
            message: `设置导入失败：JSON 解析错误：${error?.message || '未知错误'}`,
        };
    }
}

function buildSettingsImportPatch(payload) {
    const allowedKeys = new Set(Object.keys(defaultSettings));
    const patch = {};
    const ignoredKeys = [];

    Object.entries(payload).forEach(([key, value]) => {
        if (allowedKeys.has(key)) {
            patch[key] = value;
        } else {
            ignoredKeys.push(key);
        }
    });

    return { patch, ignoredKeys };
}

function importPhoneSettingsPayload(rawPayload, deps = {}) {
    const {
        savePhoneSettingsPatch,
        flushPhoneSettingsSave,
    } = deps;

    if (typeof savePhoneSettingsPatch !== 'function') {
        return { ok: false, message: '设置导入失败：保存处理器不可用' };
    }

    const parsed = parseSettingsImportPayload(rawPayload);
    if (!parsed.ok) {
        return parsed;
    }

    const { patch, ignoredKeys } = buildSettingsImportPatch(parsed.payload);
    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) {
        return {
            ok: false,
            message: ignoredKeys.length > 0
                ? `设置导入失败：未包含可识别设置字段，已忽略 ${ignoredKeys.length} 个未知字段`
                : '设置导入失败：未包含可导入的设置字段',
        };
    }

    const saved = savePhoneSettingsPatch(patch);
    if (!saved) {
        return {
            ok: false,
            message: `设置导入未完全成功：已处理 ${patchKeys.length} 个字段${ignoredKeys.length > 0 ? `，忽略 ${ignoredKeys.length} 个未知字段` : ''}`,
        };
    }

    if (typeof flushPhoneSettingsSave === 'function') {
        flushPhoneSettingsSave();
    }

    return {
        ok: true,
        message: `设置已导入：${patchKeys.length} 个字段${ignoredKeys.length > 0 ? `，忽略 ${ignoredKeys.length} 个未知字段` : ''}`,
    };
}

export function registerPhoneSlashCommandHandlers(options = {}) {
    const {
        registerCommandHandler,
        togglePhone,
        onPhoneActivated,
        onPhoneDeactivated,
        destroyPhoneRuntime,
        resetPhoneSettingsToDefault,
        getPhoneSettings,
        savePhoneSettingsPatch,
        flushPhoneSettingsSave,
        setPhoneEnabledWithUI,
    } = options;

    if (typeof registerCommandHandler !== 'function') {
        logger.warn({
            action: 'setup',
            message: 'Slash 命令处理器注册函数不可用',
        });
        return false;
    }

    registerCommandHandler('phone-action', (action) => {
        const container = getPhoneContainer();
        const toggle = getPhoneToggle();

        switch (action) {
            case 'open':
                if (container) {
                    container.classList.add('visible');
                    onPhoneActivated?.();
                    logger.info({
                        action: 'phone-action.open',
                        message: '手机已通过命令打开',
                    });
                }
                break;
            case 'close':
                if (container) {
                    container.classList.remove('visible');
                    onPhoneDeactivated?.();
                    logger.info({
                        action: 'phone-action.close',
                        message: '手机已通过命令关闭',
                    });
                }
                break;
            case 'toggle':
                togglePhone?.();
                logger.info({
                    action: 'phone-action.toggle',
                    message: '手机状态已通过命令切换',
                });
                break;
            case 'reset':
                if (toggle) {
                    resetPhoneTogglePosition();
                }
                break;
        }
    });

    registerCommandHandler('reset-settings', () => {
        const wasVisible = getPhoneContainer()?.classList.contains('visible');

        destroyPhoneRuntime?.();
        const resetOk = resetPhoneSettingsToDefault?.();
        if (!resetOk) {
            logger.warn({
                action: 'reset-settings',
                message: '设置重置失败',
            });
            return false;
        }

        setPhoneEnabledWithUI?.(false);
        const settings = typeof getPhoneSettings === 'function' ? getPhoneSettings() : null;
        if (settings?.enabled !== false) {
            setPhoneEnabledWithUI?.(true);
            if (wasVisible) {
                togglePhone?.(true);
            }
        }

        logger.info({
            action: 'reset-settings',
            message: '设置已重置',
        });
        return true;
    });

    registerCommandHandler('export-settings', () => {
        return typeof getPhoneSettings === 'function' ? getPhoneSettings() : null;
    });

    registerCommandHandler('import-settings', (rawPayload) => importPhoneSettingsPayload(rawPayload, {
        savePhoneSettingsPatch,
        flushPhoneSettingsSave,
    }));

    logger.debug({
        action: 'setup',
        message: 'Slash 命令处理器已注册',
    });
    return true;
}
