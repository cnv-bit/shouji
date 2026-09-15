function globalValue(name) {
    try {
        return typeof globalThis !== 'undefined' ? globalThis[name] : undefined;
    } catch {
        return undefined;
    }
}

function readContextFromHost() {
    try {
        const direct = globalValue('getContext');
        if (typeof direct === 'function') return direct();
        const sillyTavern = globalValue('SillyTavern');
        return typeof sillyTavern?.getContext === 'function' ? sillyTavern.getContext() : null;
    } catch {
        return null;
    }
}

function latestMessageId(request, getContext) {
    const hostMessages = Array.isArray(request?.hostMessages) ? request.hostMessages : [];
    const lastHostMessage = hostMessages.at(-1);
    if (Number.isInteger(lastHostMessage?.messageId)) return lastHostMessage.messageId;
    const chat = getContext()?.chat;
    if (Array.isArray(chat) && chat.length > 0) return chat.length - 1;
    return hostMessages.length > 0 ? hostMessages.length - 1 : -1;
}

export function createSillyTavernWorldbookReadingRuntimes(overrides = {}) {
    const deps = {
        getEjsTemplate: () => globalValue('EjsTemplate'),
        getMvu: () => globalValue('Mvu'),
        getContext: readContextFromHost,
        ...overrides,
    };

    const templateRuntime = Object.freeze({
        async prepareContext() {
            const api = deps.getEjsTemplate();
            if (typeof api?.prepareContext !== 'function') {
                throw new Error('EJS template runtime unavailable');
            }
            return api.prepareContext({}, -1);
        },
        async evalTemplate(template, context) {
            const api = deps.getEjsTemplate();
            if (typeof api?.evalTemplate !== 'function') {
                throw new Error('EJS template runtime unavailable');
            }
            return api.evalTemplate(String(template ?? ''), context);
        },
    });

    const mvuRuntime = Object.freeze({
        async readLatestStatData(request = {}) {
            const api = deps.getMvu();
            if (typeof api?.getMvuData !== 'function') return null;
            const messageId = latestMessageId(request, deps.getContext);
            if (messageId < 0) return null;
            const data = api.getMvuData({ type: 'message', message_id: messageId });
            return data?.stat_data && typeof data.stat_data === 'object'
                ? data.stat_data
                : null;
        },
    });

    return Object.freeze({ templateRuntime, mvuRuntime });
}

export const sillyTavernWorldbookReadingRuntimes = createSillyTavernWorldbookReadingRuntimes();
