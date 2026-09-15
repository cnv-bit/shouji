import { escapeHtmlAttr } from '../utils/dom-escape.js';
import { getHomeDockApps } from './home-data.js';
import { getTextIcon } from './icons.js';
import { formatQQHomeUnreadBadge, normalizeQQHomeUnreadTotal } from './qq-unread.js';
import { QQ_APP } from '../qq-v2/app-definition.js';

export function buildHomeScreenViewModel(phoneSettings, options = {}) {
    const qqUnreadTotal = normalizeQQHomeUnreadTotal(options?.qqUnreadTotal);
    const qqCustomIcon = phoneSettings?.appIcons?.[QQ_APP.id] || '';
    const qqIconHtml = qqCustomIcon
        ? `<img src="${escapeHtmlAttr(qqCustomIcon)}" class="phone-app-icon-img" alt="${escapeHtmlAttr(QQ_APP.name)}">`
        : `<div class="phone-app-icon-svg">${getTextIcon(
            'Q',
            'var(--yuzi-phone-home-qq-icon-start)',
            'var(--yuzi-phone-home-qq-icon-end)',
        )}</div>`;
    const apps = [{
        key: QQ_APP.id,
        name: QQ_APP.name,
        iconHtml: qqIconHtml,
        badgeText: formatQQHomeUnreadBadge(qqUnreadTotal),
        totalCount: qqUnreadTotal,
        animationDelay: '0s',
        isSystemApp: QQ_APP.isSystemApp,
        route: QQ_APP.route,
    }];

    const dockApps = getHomeDockApps().map((app) => {
        const customIcon = phoneSettings?.appIcons?.[`dock_${app.id}`] || '';
        const iconHtml = customIcon
            ? `<img src="${escapeHtmlAttr(customIcon)}" class="phone-app-icon-img" alt="${escapeHtmlAttr(app.name)}">`
            : `<div class="phone-app-icon-svg">${app.icon}</div>`;

        return {
            ...app,
            iconHtml,
            safeAppIdClass: String(app.id || '').replace(/[^a-zA-Z0-9_-]/g, '').replace(/_/g, '-'),
        };
    });

    return {
        apps,
        dockApps,
    };
}
