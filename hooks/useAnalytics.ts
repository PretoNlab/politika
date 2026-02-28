import posthog from '../lib/posthog';

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useAnalytics() {
    /**
     * Rastreia um evento com propriedades opcionais.
     */
    const track = (
        event: string,
        properties?: Record<string, unknown>
    ) => {
        posthog.capture(event, properties);
    };

    /**
     * Identifica o usuário autenticado no PostHog.
     */
    const identify = (userId: string, email?: string, name?: string) => {
        posthog.identify(userId, {
            email,
            name,
            platform: 'politika',
        });
    };

    /**
     * Reseta a identidade (logout).
     */
    const reset = () => {
        posthog.reset();
    };

    /**
     * Registra um page view manual.
     */
    const pageview = (path: string) => {
        posthog.capture('$pageview', { $current_url: window.location.origin + path });
    };

    return { track, identify, reset, pageview };
}
