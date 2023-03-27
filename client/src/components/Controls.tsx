import { Position, Size } from "../routes/Home"

export const Controls = (props: {
    size: () => Size
    setSize: (size: Size) => void
    setStart: (start: Position) => void
    setEnd: (end: Position) => void
    setWalls: (walls: Array<Position>) => void
    setStep: (step: number) => void
}) => {
    return (
        <div class="flex flex-grow flex-col rounded-lg border-2 border-light-secondary dark:border-dark-tertiary p-2 text-center text-sm lg:p-4 lg:text-lg">
            <h2 class="self-center text-2xl font-bold ">Parameters</h2>

            <span>Left-click will add/remove a wall.</span>
            <span>Right-click will change the ending position.</span>
            <span>Middle-click will change the starting position.</span>

            <div class="flex items-end justify-center  gap-12 p-2 pt-4 flex-wrap">
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
                            const rows = parseInt(
                                (e.target as HTMLInputElement).value
                            )
                            props.setSize({
                                cols: props.size().cols,
                                rows,
                            })
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
                            const cols = parseInt(
                                (e.target as HTMLInputElement).value
                            )
                            props.setSize({
                                cols,
                                rows: props.size().rows,
                            })
                        }}
                    />
                </label>

                <label for="rows" class="flex flex-col self-start text-start">
                    <div>
                        Step <span class="italic">(10-1000)</span>
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
                            const step = parseInt(
                                (e.target as HTMLInputElement).value
                            )
                            props.setStep(step)
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
