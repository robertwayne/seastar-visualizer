export const ColorKey = () => {
    return (
        <div class="w-full md:w-64 rounded-lg border-2 border-light-secondary p-2 text-sm">
            <h2 class="text-xl font-bold mb-1">Color Key</h2>
            <ul class="flex flex-col gap-1">
                <li>
                    <span class="font-bold text-tiles-start">Green</span>
                    {" is the starting tile"}
                </li>
                <li>
                    <span class="font-bold text-tiles-end">Red</span>
                    {" is the ending tile"}
                </li>
                <li>
                    <span class="font-bold text-tiles-wall">Dark purple</span>
                    {" is a wall"}
                </li>
                <li>
                    <span class="font-bold text-tiles-path">Brown</span>
                    {" is the path"}
                </li>
            </ul>
        </div>
    )
}
