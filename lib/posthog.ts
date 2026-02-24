import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export function initPostHog() {
    if (!POSTHOG_KEY) {
        console.warn('[PostHog] VITE_POSTHOG_KEY não definida — analytics desativado.');
        return;
    }

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,      // gerenciamos manualmente via router
        capture_pageleave: true,
        autocapture: false,           // controle total sobre o que é rastreado
        persistence: 'localStorage',
        loaded: (ph) => {
            if (import.meta.env.DEV) {
                ph.debug();               // loga eventos no console em desenvolvimento
            }
        },
    });
}

export default posthog;
