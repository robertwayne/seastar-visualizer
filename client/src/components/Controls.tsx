import { clamp } from "../utils/clamp"
import { useGrid } from "../context/GridContext"

export const Controls = (props: { canvas: HTMLCanvasElement }) => {
    const { size, setSize, step, setStep } = useGrid()

    return (
        <div class="flex-1 rounded-lg border-2 border-light-secondary p-2 text-sm dark:border-dark-tertiary">
            <h2 class="text-xl font-bold">Parameters</h2>

            <span>Left-click will add or remove a wall.</span>
            <span>Right-click will change the ending position.</span>
            <span>Middle-click will change the starting position.</span>

            <div class="flex flex-wrap items-end justify-center gap-12 p-2 pt-4">
                <label for="rows" class="flex flex-col self-start text-start">
                    <span>
                        Rows <span class="italic">(10-30)</span>
                    </span>

                    <input
                        type="number"
                        id="rows"
                        name="rows"
                        min="10"
                        max="30"
                        value={size().rows}
                        class="input-field"
                        onChange={(e) => {
                            if (!(e.target instanceof HTMLInputElement)) return

                            const rows = parseInt(e.target.value)
                            const clamped_value = clamp(rows, 10, 30)

                            setSize((prev) => ({
                                ...prev,
                                rows: clamped_value,
                            }))
                            e.target.value = clamped_value.toString()
                        }}
                    />
                </label>

                <label for="cols" class="flex flex-col self-start text-start">
                    <span>
                        Columns <span class="italic">(10-30)</span>
                    </span>

                    <input
                        type="number"
                        id="cols"
                        name="cols"
                        min="10"
                        max="30"
                        value={size().cols}
                        class="input-field"
                        onChange={(e) => {
                            if (!(e.target instanceof HTMLInputElement)) return

                            const cols = parseInt(e.target.value)
                            const clamped_value = clamp(cols, 10, 30)

                            setSize((prev) => ({
                                ...prev,
                                cols: clamped_value,
                            }))
                            e.target.value = clamped_value.toString()
                        }}
                    />
                </label>

                <label for="step" class="flex flex-col self-start text-start">
                    <span>
                        Step (ms) <span class="italic">(0-1000)</span>
                    </span>

                    <input
                        type="number"
                        id="step"
                        name="step"
                        min="0"
                        max="1000"
                        value={step()}
                        class="input-field"
                        onInput={(e) => {
                            if (!(e.target instanceof HTMLInputElement)) return

                            const step = parseInt(e.target.value)
                            const clamped_value = clamp(step, 0, 1000)

                            setStep(clamped_value)
                            e.target.value = clamped_value.toString()
                        }}
                    />
                </label>
            </div>

            <button
                class="button"
                onClick={() => {
                    props.canvas.dispatchEvent(new CustomEvent("reset"))
                }}
            >
                Reset
            </button>
        </div>
    )
}
