function normalizePromptMessages(messages) {
    return Array.isArray(messages)
        ? messages
            .filter((message) => typeof message?.role === 'string' && typeof message?.content === 'string')
            .map((message) => ({ role: message.role, content: message.content }))
        : [];
}

export function observeFinalPromptForViewer({ model = '', messages = [] } = {}) {
    try {
        const hostWindow = globalThis.window;
        if (!hostWindow || typeof hostWindow.postMessage !== 'function') return;
        const targetOrigin = hostWindow.location?.origin;
        if (typeof targetOrigin !== 'string' || targetOrigin === 'null') return;
        if (new URL(targetOrigin).origin !== targetOrigin) return;

        const promptMessages = normalizePromptMessages(messages);
        if (promptMessages.length === 0) return;

        hostWindow.postMessage({
            _fpv: true,
            model: String(model ?? ''),
            messages: promptMessages,
        }, targetOrigin);
    } catch {
        // Prompt observation must never block the real request.
    }
}

export async function confirmFinalPromptForViewer({ model = '', messages = [], signal } = {}) {
    const promptMessages = normalizePromptMessages(messages);
    const hostDocument = globalThis.document;
    if (!hostDocument?.body || typeof hostDocument.createElement !== 'function' || promptMessages.length === 0) {
        return true;
    }
    if (signal?.aborted) return false;

    const dialog = hostDocument.createElement('dialog');
    const title = hostDocument.createElement('h2');
    const modelLabel = hostDocument.createElement('div');
    const prompt = hostDocument.createElement('textarea');
    const actions = hostDocument.createElement('div');
    const cancelButton = hostDocument.createElement('button');
    const sendButton = hostDocument.createElement('button');

    dialog.setAttribute('aria-labelledby', 'qq-final-prompt-viewer-title');
    Object.assign(dialog.style, {
        boxSizing: 'border-box',
        width: 'min(900px, calc(100vw - 32px))',
        height: 'min(78vh, 720px)',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 32px)',
        minWidth: 'min(320px, calc(100vw - 32px))',
        minHeight: '240px',
        padding: '18px',
        border: '1px solid rgba(127, 127, 127, 0.45)',
        borderRadius: '14px',
        background: '#f7f6f2',
        color: '#292724',
        resize: 'both',
        overflow: 'hidden',
    });
    title.id = 'qq-final-prompt-viewer-title';
    title.textContent = '发送前提示词查看';
    Object.assign(title.style, { margin: '0 0 8px', fontSize: '20px' });
    modelLabel.textContent = `模型：${String(model || '未指定')}`;
    Object.assign(modelLabel.style, { marginBottom: '10px', fontSize: '13px', opacity: '0.75' });
    prompt.readOnly = true;
    prompt.setAttribute('aria-label', '最终发送给模型的提示词');
    prompt.value = promptMessages
        .map((message, index) => `【${index + 1} · ${message.role}】\n${message.content}`)
        .join('\n\n');
    Object.assign(prompt.style, {
        boxSizing: 'border-box',
        display: 'block',
        width: '100%',
        height: 'calc(100% - 98px)',
        minHeight: '100px',
        padding: '12px',
        border: '1px solid rgba(127, 127, 127, 0.4)',
        borderRadius: '8px',
        background: '#fff',
        color: '#222',
        font: '13px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace',
        whiteSpace: 'pre-wrap',
        overflow: 'auto',
        resize: 'none',
    });
    Object.assign(actions.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '12px',
    });
    cancelButton.type = 'button';
    cancelButton.textContent = '不发送';
    sendButton.type = 'button';
    sendButton.textContent = '发送';
    for (const button of [cancelButton, sendButton]) {
        Object.assign(button.style, {
            minWidth: '88px',
            padding: '8px 16px',
            border: '1px solid rgba(127, 127, 127, 0.45)',
            borderRadius: '8px',
            cursor: 'pointer',
        });
    }
    Object.assign(sendButton.style, { background: '#2c7a6b', color: '#fff' });
    actions.append(cancelButton, sendButton);
    dialog.append(title, modelLabel, prompt, actions);

    return new Promise((resolve) => {
        let settled = false;
        const finish = (approved) => {
            if (settled) return;
            settled = true;
            signal?.removeEventListener?.('abort', onAbort);
            if (dialog.open) dialog.close();
            dialog.remove();
            resolve(approved);
        };
        const onAbort = () => finish(false);
        cancelButton.addEventListener('click', () => finish(false), { once: true });
        sendButton.addEventListener('click', () => finish(true), { once: true });
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            finish(false);
        }, { once: true });
        dialog.addEventListener('close', () => finish(false), { once: true });
        signal?.addEventListener?.('abort', onAbort, { once: true });
        hostDocument.body.append(dialog);
        try {
            dialog.showModal();
            prompt.focus();
        } catch {
            finish(true);
        }
    });
}
