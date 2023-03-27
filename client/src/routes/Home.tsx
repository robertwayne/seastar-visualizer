import { createEffect, createSignal, onMount } from "solid-js"

import { ColorKey } from "../components/ColorKey"
import { Controls } from "../components/Controls"
import ExternalLink from "../components/ExternalLink"
import { clamp } from "../clamp"

export interface Size {
    rows: number
    cols: number
}

export interface Position {
    x: number
    y: number
}

const START_COLOR = "#3b5dc9"
const END_COLOR = "#b13e53"
const WALL_COLOR = "#7a7576"
const PATH_COLOR = "#38b764"

const Home = () => {
    let canvasRef: HTMLCanvasElement
    let contextRef: CanvasRenderingContext2D

    const [size, setSize] = createSignal({ rows: 10, cols: 10 })
    const [start, setStart] = createSignal<Position>({ x: 0, y: 0 })
    const [end, setEnd] = createSignal<Position>({ x: 9, y: 9 })
    const [walls, setWalls] = createSignal<Array<Position>>([])
    const [path, setPath] = createSignal<Array<Position>>([])
    const [step, setStep] = createSignal(20)

    let debounceTimer: NodeJS.Timer

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
                        { x: position[0], y: position[1] },
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

        // Safe to assert as we just checked for null
        canvasRef = canvas as HTMLCanvasElement

        const context = canvas.getContext("2d")
        if (!context || !(context instanceof CanvasRenderingContext2D)) {
            throw new Error("failed to acquire canvas context")
        }

        // Safe to assert as we just checked for null
        contextRef = context as CanvasRenderingContext2D

        drawPath()
    })

    /**
     * Draws the grid, including the start and end tiles, and the walls.
     */
    const drawGrid = (): void => {
        if (!canvasRef || !contextRef) {
            throw new Error("failed to acquire canvas or context")
        }

        const { tileWidth, tileHeight } = getTileSize()
        const borderColor = "#7a7576"

        contextRef.clearRect(0, 0, canvasRef.width, canvasRef.height)
        contextRef.fillStyle = borderColor
        contextRef.imageSmoothingEnabled = false
        contextRef.translate(0.5, 0.5)

        for (let i = 0; i < size().rows; i++) {
            for (let j = 0; j < size().cols; j++) {
                contextRef.strokeStyle = borderColor
                contextRef.strokeRect(
                    j * tileWidth,
                    i * tileHeight,
                    tileWidth,
                    tileHeight
                )
            }
        }

        // Fill in the start tile.
        drawTile(start().x, start().y, tileWidth, tileHeight, START_COLOR)

        // Fill in the end tile.
        drawTile(end().x, end().y, tileWidth, tileHeight, END_COLOR)

        // Fill in the walls.
        for (const wall of walls()) {
            drawTile(wall.x, wall.y, tileWidth, tileHeight, WALL_COLOR)
        }
    }

    createEffect(() => {
        if (!canvasRef || !contextRef) {
            throw new Error("failed to acquire canvas or context")
        }

        drawPath()
    })

    /** Draws a completed path from start to end. */
    const drawPath = async (): Promise<void> => {
        clearTimeout(debounceTimer)
        drawGrid()

        debounceTimer = setTimeout(async () => {
            await getPath()

            const { tileWidth, tileHeight } = getTileSize()

            drawGrid()
            for (const tile of path()) {
                if (collides(tile, [start(), end(), ...walls()])) continue

                drawTile(tile.x, tile.y, tileWidth, tileHeight, PATH_COLOR)

                if (step() > 0) {
                    await new Promise((resolve) => setTimeout(resolve, step()))
                }
            }
        }, 350)
    }

    /**
     * Draws a tile and its border at the given position with the given width,
     * height, and color.
     */
    const drawTile = (x: number, y: number, width: number, height: number, color: string) => {
        contextRef.strokeStyle = "#222831"
        contextRef.strokeRect(
            x * width,
            y * height,
            width,
            height
        )

        contextRef.fillStyle = color
        contextRef.fillRect(
            x * width,
            y * height,
            width,
            height
        )
    }

    /**
     * Returns a `Position` object containing the row and column of the tile
     * that was clicked on.
     */
    const getTilePosition = (event: MouseEvent): Position => {
        const canvas = event.target as HTMLCanvasElement
        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const { tileWidth, tileHeight } = getTileSize()
        const dpi = window.devicePixelRatio

        const row = Math.floor((y * dpi) / tileHeight)
        const col = Math.floor((x * dpi) / tileWidth)

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
                (wall) => wall.x === x && wall.y === y
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
        canvasRef.width = canvasRef.offsetWidth * scale
        canvasRef.height = canvasRef.offsetHeight * scale

        const tileWidth = canvasRef.width / cols
        const tileHeight = canvasRef.height / rows

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

    return (
        <div class="flex h-full w-full flex-col items-center">
            <div class="flex flex-col justify-between gap-4 lg:w-2/3 lg:flex-col">
                <div class="flex flex-col items-center gap-2 text-center">
                    <p class="lg:w-2/3">
                        Seastar is a Rust library implementing the A*
                        pathfinding algorithm specifically for uniform-cost
                        grids. You can download see the{" "}
                        <ExternalLink to="">code on GitHub</ExternalLink>.
                    </p>
                    <p class="lg:w-2/3">
                        Seastar itself is running on a server (perhaps one day I
                        will move it into a WebAssembly module), so there is a
                        minor debounce on the pathfinding algorithm to prevent
                        the server from being overloaded.
                    </p>
                </div>
                <div class="flex w-full flex-col justify-between gap-2 lg:flex-row lg:gap-4">
                    <ColorKey />

                    <Controls
                        size={size}
                        setSize={setSize}
                        setStart={setStart}
                        setEnd={setEnd}
                        setWalls={setWalls}
                        setStep={setStep}
                    />
                </div>
            </div>

            <canvas
                id="canvas"
                class="mt-2 flex aspect-square h-full w-full border-2 border-tiles-wall transition lg:mt-8 lg:h-fit lg:w-2/3"
                onContextMenu={(e) => {
                    e.preventDefault()
                }}
                onPointerDown={(e) => {
                    e.preventDefault()
                    selectTarget(e)
                    drawPath()
                }}
                onAuxClick={(e) => {
                    e.preventDefault()
                }}
            ></canvas>
        </div>
    )
}

export default Home
