import { useGrid } from "../context/GridContext"

export const StatusText = () => {
    const { path } = useGrid()

    return (
        <div class="text-xl font-bold text-center">
            {path().length > 0
                ? `Ideal path requires ${path().length - 2} steps.`
                : "No valid path found."}
        </div>
    )
}
