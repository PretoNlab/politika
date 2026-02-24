import posthog from '../lib/posthog';

// ─── Tipos dos eventos ───────────────────────────────────────────────────────

type AuthEvents = {
    user_signed_in: { method: 'email' };
    user_signed_up: { method: 'email' };
    user_signed_out: Record<string, never>;
};

type AnalysisEvents = {
    analysis_requested: {
        type: 'individual' | 'comparison';
        handle_count: number;
        workspace_id?: string;
        workspace_region?: string;
    };
    analysis_completed: {
        type: 'individual' | 'comparison';
        handle: string;
        workspace_id?: string;
        duration_ms?: number;
    };
    analysis_history_opened: {
        analysis_id: string;
        type: 'individual' | 'comparison';
    };
};

type BriefingEvents = {
    briefing_generated: {
        workspace_id?: string;
        workspace_region?: string;
    };
};

type AlertEvents = {
    alert_created: {
        workspace_id?: string;
    };
    alert_dismissed: {
        alert_type?: string;
    };
};

type CrisisEvents = {
    crisis_analysed: {
        workspace_id?: string;
        scenario_keywords?: string[];
    };
};

type PulseEvents = {
    pulse_monitor_viewed: {
        workspace_id?: string;
        workspace_region?: string;
    };
    watchword_added: {
        workspace_id?: string;
        total_watchwords?: number;
    };
};

type WorkspaceEvents = {
    workspace_created: {
        region?: string;
        has_candidate?: boolean;
    };
    workspace_updated: {
        workspace_id: string;
    };
    workspace_deleted: {
        workspace_id: string;
    };
    workspace_switched: {
        workspace_id: string;
        workspace_region?: string;
    };
};

type ShareEvents = {
    insight_shared: {
        type: 'individual' | 'comparison';
        analysis_id?: string;
    };
};

type AllEvents = AuthEvents & AnalysisEvents & BriefingEvents & AlertEvents &
    CrisisEvents & PulseEvents & WorkspaceEvents & ShareEvents;

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useAnalytics() {
    /**
     * Rastreia um evento tipado.
     */
    const track = <E extends keyof AllEvents>(
        event: E,
        properties?: AllEvents[E]
    ) => {
        posthog.capture(event as string, properties as Record<string, unknown>);
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
