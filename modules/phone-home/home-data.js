import { PHONE_ICONS } from './icons.js';

export function getHomeDockApps() {
    return [
        { id: 'settings', name: '设置', icon: PHONE_ICONS.gear, route: 'settings' },
    ];
}
