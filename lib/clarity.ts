type ClarityFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    clarity?: ClarityFn & { q?: unknown[][] };
  }
}

function loadClarityScript(projectId: string) {
  const existing = document.querySelector('script[data-clarity="true"]');
  if (existing) return;

  (function (c: Window, l: Document, a: 'clarity', r: 'script', i: string, t?: HTMLScriptElement, y?: Element) {
    c[a] = c[a] || function (...args: unknown[]) {
      (c[a]!.q = c[a]!.q || []).push(args);
    };
    t = l.createElement(r);
    t.async = true;
    t.src = `https://www.clarity.ms/tag/${i}`;
    t.setAttribute('data-clarity', 'true');
    y = l.getElementsByTagName(r)[0];
    y?.parentNode?.insertBefore(t, y);
  })(window, document, 'clarity', 'script', projectId);
}

export function initClarity() {
  const enabledRaw = String(import.meta.env.VITE_ENABLE_CLARITY || '');
  const isEnabled = enabledRaw.trim().toLowerCase() === 'true';
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID || '';

  if (!isEnabled) return;

  if (!projectId) {
    console.warn('[Clarity] VITE_CLARITY_PROJECT_ID não definida — Clarity desativado.');
    return;
  }

  loadClarityScript(projectId);
}
