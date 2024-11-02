import { createEffect, createSignal, onCleanup, onMount } from "solid-js"
import { COLORS, Position } from "../types"
import { clamp } from "../utils/clamp"
import { useGrid } from "../context/GridContext"

export const Canvas = (props: { ref: HTMLCanvasElement }) => {
    const { path, setPath, size, step } = useGrid()
    let contextRef: CanvasRenderingContext2D

    const [start, setStart] = createSignal<Position>({ x: 0, y: 0 })
    const [end, setEnd] = createSignal<Position>({ x: 9, y: 9 })
    const [walls, setWalls] = createSignal<Array<Position>>([])

    let debounceTimer: ReturnType<typeof setTimeout>

    /**
     * Submits the grid to the server where `seastar::astar` will be run,
     * returning a path from the start to the end. If there is no valid path,
     * the returned array will be empty.
     */
    const getPath = async (): Promise<void> => {
        await fetch(`${import.meta.env.VITE_API_URL}/astar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                width: clamp(size().cols, 10, 100),
                height: clamp(size().rows, 10, 100),
                startX: start().x,
                startY: start().y,
                endX: end().x,
                endY: end().y,
                walls: walls(),
            }),
        })
            .then(async (response) => {
                const json = await response.json()
                setPath([])
                for (const position of json.path) {
                    setPath((path) => [
                        ...path,
                        { x: position.x, y: position.y },
                    ])
                }
            })
            .catch((error) => {
                console.log(error)
            })
    }

    onMount(() => {
        const canvas = document.getElementById("canvas")
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error("failed to acquire canvas")
        }

        props.ref = canvas
        const context = canvas.getContext("2d")
        if (!context) {
            throw new Error("failed to acquire canvas context")
        }

        contextRef = context
        contextRef.scale(window.devicePixelRatio, window.devicePixelRatio)
        contextRef.imageSmoothingEnabled = false

        // Add event listeners
        const handleResize = () => drawCanvas()
        const handleReset = () => {
            setWalls([])
            setStart({ x: 0, y: 0 })
            setEnd({ x: 9, y: 9 })
            drawPath()
        }

        window.addEventListener("resize", handleResize)
        canvas.addEventListener("reset", handleReset)
        drawCanvas()
        drawPath()

        // Cleanup
        onCleanup(() => {
            window.removeEventListener("resize", handleResize)
            canvas.removeEventListener("reset", handleReset)
        })
    })

    /**
     * Draws just the grid lines
     */
    const drawGrid = (): void => {
        if (!contextRef) {
            throw new Error("failed to acquire canvas context")
        }

        const { tileWidth, tileHeight } = getTileSize()
        const scale = window.devicePixelRatio

        // Reset any transformations
        contextRef.setTransform(1, 0, 0, 1, 0, 0)

        // Apply DPI scaling
        contextRef.scale(scale, scale)

        // Set grid line properties
        contextRef.strokeStyle = COLORS.WALL
        contextRef.lineWidth = 1 / scale // Adjust line width for DPI scaling
        contextRef.imageSmoothingEnabled = false

        // Draw horizontal lines
        for (let i = 0; i <= size().rows; i++) {
            contextRef.beginPath()
            contextRef.moveTo(0, i * tileHeight)
            contextRef.lineTo(props.ref.width / scale, i * tileHeight)
            contextRef.stroke()
        }

        // Draw vertical lines
        for (let i = 0; i <= size().cols; i++) {
            contextRef.beginPath()
            contextRef.moveTo(i * tileWidth, 0)
            contextRef.lineTo(i * tileWidth, props.ref.height / scale)
            contextRef.stroke()
        }
    }

    /**
     * Draws all tiles (empty, start, end, walls, and path)
     */
    const drawTiles = (): void => {
        const { tileWidth, tileHeight } = getTileSize()
        const rows = size().rows
        const cols = size().cols

        // Draw all tiles, including empty ones
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const pos = { x, y }

                // Determine tile color based on its type
                let color = "transparent" // Empty tiles are transparent

                if (pos.x === start().x && pos.y === start().y) {
                    color = COLORS.START
                } else if (pos.x === end().x && pos.y === end().y) {
                    color = COLORS.END
                } else if (collides(pos, walls())) {
                    color = COLORS.WALL
                } else if (collides(pos, path())) {
                    color = COLORS.PATH
                }

                // Draw the tile and its grid lines
                drawTile(x, y, tileWidth, tileHeight, color)
            }
        }
    }

    /**
     * Draws the entire canvas
     */
    const drawCanvas = (): void => {
        if (!contextRef) {
            throw new Error("failed to acquire canvas context")
        }

        // Clear the entire canvas
        contextRef.clearRect(0, 0, props.ref.width, props.ref.height)

        // Draw the outer grid lines first
        const { tileWidth, tileHeight } = getTileSize()
        const scale = window.devicePixelRatio

        // Draw top and left borders of the grid
        contextRef.strokeStyle = COLORS.WALL
        contextRef.lineWidth = 1
        contextRef.beginPath()
        contextRef.moveTo(0, 0)
        contextRef.lineTo(props.ref.width, 0)
        contextRef.moveTo(0, 0)
        contextRef.lineTo(0, props.ref.height)
        contextRef.stroke()

        // Draw tiles (which will draw their own grid lines)
        drawTiles()
    }

    /** Draws a completed path from start to end. */
    const drawPath = async (): Promise<void> => {
        clearTimeout(debounceTimer)

        debounceTimer = setTimeout(async () => {
            await getPath()

            // Store the current path
            const currentPath = path()

            // Clear the path before starting animation
            setPath([])

            // Initial draw with grid and current state
            contextRef.clearRect(0, 0, props.ref.width, props.ref.height)
            drawGrid()
            drawTiles()

            // Animate the path
            if (step() > 0) {
                for (let i = 0; i < currentPath.length; i++) {
                    const tile = currentPath[i]

                    if (!tile) continue
                    if (collides(tile, [start(), end(), ...walls()])) continue

                    setPath((prev) => [...prev, tile])

                    contextRef.clearRect(
                        0,
                        0,
                        props.ref.width,
                        props.ref.height,
                    )
                    drawGrid()
                    drawTiles()

                    await new Promise((resolve) => setTimeout(resolve, step()))
                }
            } else {
                // If step is 0, draw the entire path immediately
                setPath(currentPath)
                contextRef.clearRect(0, 0, props.ref.width, props.ref.height)
                drawGrid()
                drawTiles()
            }
        }, 350)
    }

    /**
     * Draws a tile and its grid lines at the given position
     */
    const drawTile = (
        x: number,
        y: number,
        width: number,
        height: number,
        color: string,
    ) => {
        const scale = window.devicePixelRatio

        // Draw the tile
        contextRef.fillStyle = color
        contextRef.fillRect(
            x * width * scale,
            y * height * scale,
            width * scale,
            height * scale,
        )

        // Draw the grid lines
        contextRef.strokeStyle = COLORS.WALL
        contextRef.lineWidth = 1

        // Draw right and bottom borders
        contextRef.beginPath()
        contextRef.moveTo((x + 1) * width * scale, y * height * scale)
        contextRef.lineTo((x + 1) * width * scale, (y + 1) * height * scale)
        contextRef.moveTo(x * width * scale, (y + 1) * height * scale)
        contextRef.lineTo((x + 1) * width * scale, (y + 1) * height * scale)
        contextRef.stroke()
    }

    /**
     * Returns a `Position` object containing the row and column of the tile
     * that was clicked on.
     */
    const getTilePosition = (event: MouseEvent): Position => {
        const canvas = event.target as HTMLCanvasElement
        const rect = canvas.getBoundingClientRect()

        // Get the click position relative to the canvas
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        // Get the canvas scale factor (actual size vs display size)
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        // Calculate the actual position in the canvas
        const canvasX = x * scaleX
        const canvasY = y * scaleY

        const { tileWidth, tileHeight } = getTileSize()
        const scale = window.devicePixelRatio

        // Calculate the grid position
        const col = Math.floor(canvasX / (tileWidth * scale))
        const row = Math.floor(canvasY / (tileHeight * scale))

        return { x: col, y: row }
    }

    /**
     * Sets the ending position to the tile that was clicked on. If the tile is
     * a wall or the start tile, the end position will not be changed.
     */
    const selectEnd = (event: MouseEvent): void => {
        const { x, y } = getTilePosition(event)

        if (collides({ x, y }, [start(), end(), ...walls()])) return

        setEnd({ x, y })
    }

    /**
     * Sets the starting position to the tile that was clicked on. If the tile
     * is a wall or the end tile, the start position will not be changed.
     */
    const selectStart = (event: MouseEvent): void => {
        const { x, y } = getTilePosition(event)

        if (collides({ x, y }, [start(), end(), ...walls()])) return

        setStart({ x, y })
    }

    /**
     * Predicate returning whether a given position collides with a given array
     * of positions.
     */
    const collides = (p1: Position, p2: Array<Position>): boolean => {
        for (const p of p2) {
            if (p1.x === p.x && p1.y === p.y) {
                return true
            }
        }

        return false
    }

    /**
     * Toggles a wall at the tile that was clicked on. If the tile is the start
     * or end position, no wall will be added.
     */
    const toggleWall = (event: MouseEvent): void => {
        const { x, y } = getTilePosition(event)

        if (collides({ x, y }, [start(), end()])) return

        setWalls((prev) => {
            const newWalls = [...prev]
            const index = newWalls.findIndex(
                (wall) => wall.x === x && wall.y === y,
            )
            if (index === -1) {
                newWalls.push({ x, y })
            } else {
                newWalls.splice(index, 1)
            }
            return newWalls
        })
    }

    /**
     * Returns the width and height of each tile in the grid, taking into
     * account DPI.
     */
    const getTileSize = (): { tileWidth: number; tileHeight: number } => {
        const rows = size().rows
        const cols = size().cols

        const scale = window.devicePixelRatio

        // Set both canvases to the same size
        props.ref.width = props.ref.offsetWidth * scale
        props.ref.height = props.ref.offsetHeight * scale

        // Calculate tile sizes based on the smaller dimension to maintain square aspect ratio
        const tileWidth = props.ref.width / cols / scale
        const tileHeight = props.ref.height / rows / scale

        return { tileWidth, tileHeight }
    }

    /**
     * This function will discern between left, right, and middle clicks -
     * calling the appropriate function to set that tile.
     */
    const selectTarget = (event: MouseEvent): void => {
        switch (event.button) {
            case 0: // Left click
                toggleWall(event)
                break
            case 1: // Middle click
                selectStart(event)
                break
            case 2: // Right click
                selectEnd(event)
                break
            default:
                break
        }
    }

    createEffect(() => {
        const _ = size()
        if (contextRef) {
            drawCanvas()
        }
    })

    return (
        <div class="flex-1 min-h-0 flex items-center justify-center">
            <div class="max-h-full max-w-full h-[min(100%,_100vw-2rem)] aspect-square border-2 border-tiles-wall">
                <canvas
                    id="canvas"
                    class="w-full h-full"
                    onContextMenu={(e) => e.preventDefault()}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        selectTarget(e)
                        drawPath()
                    }}
                    onAuxClick={(e) => e.preventDefault()}
                />
            </div>
        </div>
    )
}
