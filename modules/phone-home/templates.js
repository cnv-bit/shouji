import { buildShellRegionHtml } from '../view-regions.js';
import { escapeHtml, escapeHtmlAttr } from '../utils/dom-escape.js';

export function buildHomeShellStyleText({
    bgStyle,
    homeAppLabelColor,
    homeAppLabelShadow,
    appIconSize,
    appIconRadius,
    appGridColumns,
    appGridGap,
    dockIconSize,
}) {
    const styleChunks = [];

    if (bgStyle) {
        styleChunks.push(bgStyle);
    }

    styleChunks.push(`--yuzi-phone-home-app-icon-size:${appIconSize}px`);
    styleChunks.push(`--yuzi-phone-home-app-icon-radius:${appIconRadius}px`);
    styleChunks.push(`--yuzi-phone-home-grid-columns:${appGridColumns}`);
    styleChunks.push(`--yuzi-phone-home-grid-column-gap:${appGridGap}px`);
    styleChunks.push(`--yuzi-phone-home-dock-icon-size:${dockIconSize}px`);
    styleChunks.push(`--yuzi-phone-home-app-label-color:${String(homeAppLabelColor || 'var(--yuzi-phone-home-app-label-color-on-dark)')}`);
    styleChunks.push(`--yuzi-phone-home-app-label-shadow:${String(homeAppLabelShadow || 'var(--yuzi-phone-home-app-label-shadow-on-dark)')}`);

    return styleChunks.join('; ');
}

export function buildHomeShellHtml(styleText) {
    return `
        <div class="phone-home" data-home-shell="root" style="${escapeHtmlAttr(String(styleText || ''))}">
            ${buildShellRegionHtml({
                region: 'home-grid',
                className: 'phone-app-grid',
            })}
            ${buildShellRegionHtml({
                region: 'home-dock',
                className: 'phone-dock',
                attrs: 'data-dock-count="1"',
            })}
        </div>
    `;
}

export function buildHomeAppItemHtml(iconHtml, name) {
    return `
        <div class="phone-app-icon">${iconHtml}</div>
        <span class="phone-app-label">${escapeHtml(String(name || ''))}</span>
    `;
}

export function buildDockItemHtml(iconHtml, name) {
    return `
        <div class="phone-app-icon phone-dock-icon">${iconHtml}</div>
        <span class="phone-app-label">${escapeHtml(String(name || ''))}</span>
    `;
}
