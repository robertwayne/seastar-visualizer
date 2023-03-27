import { Position, Size } from "../routes/Home"

import { clamp } from "../clamp"

export const Controls = (props: {
    size: () => Size
    setSize: (size: Size) => void
    setStart: (start: Position) => void
    setEnd: (end: Position) => void
    setWalls: (walls: Array<Position>) => void
    setStep: (step: number) => void
}) => {
    return (
        <div class="flex flex-grow flex-col rounded-lg border-2 border-light-secondary p-2 text-center text-sm dark:border-dark-tertiary lg:p-4 lg:text-lg">
            <h2 class="self-center text-2xl font-bold ">Parameters</h2>

            <span>Left-click will add/remove a wall.</span>
            <span>Right-click will change the ending position.</span>
            <span>Middle-click will change the starting position.</span>

            <div class="flex flex-wrap items-end  justify-center gap-12 p-2 pt-4">
                <label for="rows" class="flex flex-col self-start text-start">
                    <div>
                        Rows <span class="italic">(10-100)</span>
                    </div>

                    <input
                        type="number"
                        id="rows"
                        name="rows"
                        min="10"
                        max="100"
                        value="10"
                        class="input-field"
                        onChange={(e) => {
                            if (!(e.target instanceof HTMLInputElement)) return

                            const rows = parseInt(
                                (e.target as HTMLInputElement).value
                            )

                            const clamped_value = clamp(rows, 10, 100)

                            props.setSize({
                                cols: props.size().cols,
                                rows: clamped_value,
                            })
                            e.target.value = clamped_value.toString()
                        }}
                    />
                </label>

                <label for="cols" class="flex flex-col self-start text-start">
                    <div>
                        Columns <span class="italic">(10-100)</span>
                    </div>

                    <input
                        type="number"
                        id="cols"
                        name="cols"
                        min="10"
                        max="100"
                        value="10"
                        class="input-field"
                        onChange={(e) => {
                            if (!(e.target instanceof HTMLInputElement)) return

                            const cols = parseInt(
                                (e.target as HTMLInputElement).value
                            )

                            const clamped_value = clamp(cols, 10, 100)

                            props.setSize({
                                cols: clamped_value,
                                rows: props.size().rows,
                            })
                            e.target.value = clamped_value.toString()
                        }}
                    />
                </label>

                <label for="step" class="flex flex-col self-start text-start">
                    <div>
                        Step <span class="italic">(0-1000)</span>
                    </div>

                    <input
                        type="number"
                        id="step"
                        name="step"
                        min="0"
                        max="1000"
                        value="25"
                        class="input-field"
                        onInput={(e) => {
                            if (!(e.target instanceof HTMLInputElement)) return

                            const step = parseInt(
                                (e.target as HTMLInputElement).value
                            )

                            const clamped_value = clamp(step, 0, 1000)

                            props.setStep(clamped_value)
                            e.target.value = clamped_value.toString()
                        }}
                    />
                </label>
            </div>

            <button
                class="button"
                onClick={() => {
                    props.setWalls([])
                    props.setStart({ x: 0, y: 0 })
                    props.setEnd({ x: 9, y: 9 })
                }}
            >
                Reset
            </button>
        </div>
    )
}
