<script lang="ts">
    // UI : Carbon
    import 'carbon-components-svelte/css/all.css';
    import './theme/hakuneko.css';
    import './theme/global.css';
    import { Content } from 'carbon-components-svelte';
    // Svelte
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';

    // UI: Components
    import Theme from './components/Theme.svelte';
    import MediaSelect from './components/MediaSelect.svelte';
    import MediaItemSelect from './components/MediaItemSelect.svelte';
    import DownloadsStatus from './components/DownloadManagerStatus.svelte';
    import Viewer from './components/viewer/Viewer.svelte';
    import AppBar from './components/AppBar.svelte';
    import UserMessage from './components/UserMessages.svelte';
    import ContentPage from './components/content-pages/ContentRouter.svelte';
    // UI: Stores
    import { Settings } from './stores/Settings.svelte';
    import { Store as UI} from './stores/Stores.svelte';
    import StartupGuide from './components/startupguide/StartupGuide.svelte';

    let resolveFinishLoading: () => void;
    export const FinishLoading = Promise.race([
        new Promise((resolve) => setTimeout(resolve, 7500)),
        new Promise<void>((resolve) => (resolveFinishLoading = resolve)),
    ]);

    onMount(() => {
        history.replaceState({ view: UI.view }, '');
        const handlePopState = (event: PopStateEvent) => {
            UI.view = event.state?.view ?? 'media';
        };
        window.addEventListener('popstate', handlePopState);
        // some delay for pre-rendering
        // Todo: find a way to detect if the UI is loaded
        setTimeout(resolveFinishLoading, 2500);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    });

    let showHome = true;
</script>

<UserMessage />
{#if Settings.StartupGuideEnabled.Value}
    <StartupGuide/>
{/if}

<Theme theme={Settings.Theme.Value}>
    <AppBar
        onHome={() => {
            UI.selectedItem = null;
            UI.contentscreen = '/';
        }}
    />

    <Content
        id="hakunekoapp"
        class="
            {Settings.ContentPanel.Value ? 'ui-mode-content' : 'ui-mode-download'}
            {Settings.SidenavTrail.Value ? 'ui-mode-sidenav' : ''}
        "
    >
        <div id="TopContainer">
            {#if UI.view === 'media'}
                <MediaSelect />
            {:else if UI.view === 'media-item'}
                <MediaItemSelect />
            {:else if UI.view === 'content'}
                <div id="Content" transition:fade>
                    {#if UI.selectedItem}
                        <Viewer item={UI.selectedItem} />
                    {:else if showHome}
                        <ContentPage />
                    {/if}
                </div>
            {/if}
        </div>
        <div id="Bottom">
            <DownloadsStatus />
        </div>
    </Content>
</Theme>

<style>
    :global(::-webkit-scrollbar) {
        width: 1em; /* Necessary so scrollbar changes from default*/
    }
    :global(::-webkit-scrollbar-track) {
        background: var(--cds-ui-background); /* Background of scrollbar */
    }
    :global(::-webkit-scrollbar-thumb) {
        background: var(--cds-active-ui); /* Scroll marker */
        border-radius: 2em; /* So marker has rounded edges */
    }
    :global(#hakunekoapp) {
        height: calc(100vh - 3.5em);
        max-height: calc(100vh - 3.5em);
        display: grid;
        padding: 0.5em;
        gap: 0.3em 0.3em;
        grid-template-rows: minmax(80vh, 1fr) auto;
    }
    :global(.ui-mode-sidenav) {
        margin-left: 3rem!important;
    }
    :global(.ui-mode-content), :global(.ui-mode-download) {
        grid-template-columns: 1fr;
        grid-template-areas:
            'TopContainer'
            'Bottom';
    }

    #Content {
        height: 100%;
        overflow-y: auto;
    }
    #TopContainer {
        grid-area: TopContainer;
    }
    #Bottom {
        grid-area: Bottom;
        margin-bottom:1em;
    }
    :global(#Header) {
        -webkit-app-region: drag;
    }

    :global(.bx--header__global) {
        -webkit-app-region: drag;
    }

    :global(.bx--header__global > *) {
        -webkit-app-region: no-drag;
    }
    :global(.bx--modal-container) {
        -webkit-app-region: no-drag;
    }
</style>