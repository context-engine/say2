<script lang="ts" module>
    export interface FormData {
        serverCommand: string;
        sessionName: string;
        debugMode: boolean;
        timeout: number;
    }

    export interface Props {
        /** Form is submitting */
        loading?: boolean;
        /** Error message to display */
        error?: string;
        /** Submit handler */
        onSubmit?: (data: FormData) => void;
        /** Cancel handler */
        onCancel?: () => void;
    }
</script>

<script lang="ts">
    import Input from "../../../primitives/Input/Input.svelte";
    import Button from "../../../primitives/Button/Button.svelte";
    import Toggle from "../../../primitives/Toggle/Toggle.svelte";

    let { loading = false, error, onSubmit, onCancel }: Props = $props();

    let serverCommand = $state("");
    let sessionName = $state("");
    let debugMode = $state(false);
    let timeout = $state(30000);

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        if (!serverCommand.trim()) return;
        onSubmit?.({
            serverCommand: serverCommand.trim(),
            sessionName: sessionName.trim(),
            debugMode,
            timeout,
        });
    };
</script>

<form class="ce-create-session-form" onsubmit={handleSubmit}>
    <h2 class="ce-create-session-form__title">Create Session</h2>

    {#if error}
        <div class="ce-create-session-form__error" role="alert">
            {error}
        </div>
    {/if}

    <div class="ce-create-session-form__field">
        <label for="serverCommand" class="ce-create-session-form__label">
            Server Command <span class="ce-create-session-form__required"
                >*</span
            >
        </label>
        <Input
            id="serverCommand"
            bind:value={serverCommand}
            placeholder="npx @modelcontextprotocol/server-echo"
            disabled={loading}
            required
        />
    </div>

    <div class="ce-create-session-form__field">
        <label for="sessionName" class="ce-create-session-form__label">
            Session Name
        </label>
        <Input
            id="sessionName"
            bind:value={sessionName}
            placeholder="My Test Session"
            disabled={loading}
        />
    </div>

    <div
        class="ce-create-session-form__field ce-create-session-form__field--inline"
    >
        <Toggle bind:checked={debugMode} disabled={loading} />
        <label class="ce-create-session-form__label">Debug Mode</label>
    </div>

    <div class="ce-create-session-form__actions">
        <Button
            variant="ghost"
            onclick={onCancel}
            disabled={loading}
            type="button"
        >
            Cancel
        </Button>
        <Button variant="primary" {loading} type="submit">Create</Button>
    </div>
</form>

<style>
    .ce-create-session-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        font-family: var(--font-ui);
    }

    .ce-create-session-form__title {
        margin: 0;
        font-size: var(--text-lg);
        font-weight: 600;
        color: var(--color-text-primary);
    }

    .ce-create-session-form__error {
        padding: var(--space-3);
        background: color-mix(in srgb, var(--color-error) 10%, transparent);
        border: 1px solid var(--color-error);
        border-radius: var(--radius-md);
        color: var(--color-error);
        font-size: var(--text-sm);
    }

    .ce-create-session-form__field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .ce-create-session-form__field--inline {
        flex-direction: row;
        align-items: center;
        gap: var(--space-2);
    }

    .ce-create-session-form__label {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--color-text-primary);
    }

    .ce-create-session-form__required {
        color: var(--color-error);
    }

    .ce-create-session-form__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
        margin-top: var(--space-2);
    }
</style>
