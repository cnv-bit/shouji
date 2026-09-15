import { QQ_APP } from '../../../qq-v2/app-definition.js';

const DOCK_ICON_SLOTS = Object.freeze([
    Object.freeze({ key: 'dock_settings', name: '设置', type: 'dock' }),
]);

function normalizeSlotKey(value) {
    return String(value || '').trim();
}

function normalizeSlotName(value, fallback) {
    const name = String(value || '').trim();
    return name || fallback;
}

function dedupeIconSlots(slots) {
    const used = new Set();
    const normalized = [];

    slots.forEach((slot) => {
        const key = normalizeSlotKey(slot?.key);
        if (!key || used.has(key)) return;
        used.add(key);
        normalized.push({
            key,
            name: normalizeSlotName(slot?.name, key),
            type: normalizeSlotName(slot?.type, 'app'),
        });
    });

    return normalized;
}

export function collectAppearanceIconSlots() {
    return dedupeIconSlots([
        { key: QQ_APP.id, name: QQ_APP.name, type: 'system' },
        ...DOCK_ICON_SLOTS,
    ]);
}

export function buildAppearanceAppCatalog() {
    return Object.freeze({
        iconSlots: collectAppearanceIconSlots(),
    });
}
