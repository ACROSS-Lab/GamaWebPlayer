export function createSimulationControlPanel(controller) {
    const playPauseButton = document.getElementById("simulation-play-pause");
    const stepButton = document.getElementById("simulation-step");
    const reloadButton = document.getElementById("simulation-reload");
    const modeSelect = document.getElementById("simulation-mode");
    const cycleOutput = document.getElementById("simulation-cycle");

    let busy = false;

    function render(state) {
        const running = state === "RUNNING";
        const ready = 
            state === "STOPPED" ||
            state === "PAUSED" ||
            state === "RUNNING";
        const canChangeMode = state === "STOPPED" || state === "PAUSED";

        modeSelect.disabled = busy || !canChangeMode;
        if (!busy) {
            modeSelect.value = controller.mode;
        }

        playPauseButton.textContent = running ? "Pause" : "Play";
        playPauseButton.title = running ? "Pause" : "Play";
        playPauseButton.setAttribute("aria-label", running ? "Pause" : "Play");
        playPauseButton.disabled = busy || !ready;

        stepButton.disabled = busy || (state !== "STOPPED" && state !== "PAUSED");

        reloadButton.disabled = busy || state === "UNINITIALIZED";
    }

    async function execute(action) {
        busy = true;
        render(controller.state);

        try {
            await action();
        } catch (error) {
            console.error("Simulation command failed:", error);
        } finally {
            busy = false;
            render(controller.state);
        }
    }

    playPauseButton.addEventListener("click", () => {
        execute(() => 
            controller.state === "RUNNING" ? controller.pause() : controller.start()
        );
    });

    stepButton.addEventListener("click", () => {
        execute(() => controller.step());
    });

    reloadButton.addEventListener("click", () => {
        execute(() => controller.reload());
    });

    modeSelect.addEventListener("change", () => {
        const requestedMode = modeSelect.value;
        execute(() => controller.changeMode(requestedMode));
    });

    controller.onStateChange(render);
    // In case of host/viewers
    controller.onModeChange(() => {render(controller.state)});
    controller.onCycleChange((cycle) => {
        cycleOutput.textContent = String(cycle);
    });
}