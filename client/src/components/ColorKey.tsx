export const ColorKey = () => {
    return (
        <div class="flex min-w-fit flex-col rounded-lg border-2 border-light-secondary dark:border-dark-tertiary p-2 text-center text-sm lg:p-4 lg:text-lg">
            <h2 class="text-2xl font-bold">Color Key</h2>
            <span>
                <span class={`font-bold text-tiles-start`}>Blue</span> is the
                starting tile.
            </span>

            <span>
                <span class={`font-bold text-tiles-end`}>Red</span> is the
                ending tile.
            </span>

            <span>
                <span class={`font-bold text-tiles-wall`}>Black</span> is a
                wall.
            </span>

            <span>
                <span class={`font-bold text-tiles-path`}>Green</span> is the
                path.
            </span>
        </div>
    )
}
