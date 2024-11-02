import { createContext, useContext, ParentProps } from "solid-js"
import { createSignal, Accessor, Setter } from "solid-js"
import { Position, Size } from "../types"

interface GridContextValue {
    path: Accessor<Position[]>
    setPath: Setter<Position[]>
    size: Accessor<Size>
    setSize: Setter<Size>
    step: Accessor<number>
    setStep: Setter<number>
}

const GridContext = createContext<GridContextValue>()

export function GridProvider(props: ParentProps) {
    const [path, setPath] = createSignal<Position[]>([])
    const [size, setSize] = createSignal<Size>({ rows: 10, cols: 10 })
    const [step, setStep] = createSignal(20)

    const value = {
        path,
        setPath,
        size,
        setSize,
        step,
        setStep,
    }

    return (
        <GridContext.Provider value={value}>
            {props.children}
        </GridContext.Provider>
    )
}

export function useGrid() {
    const context = useContext(GridContext)
    if (!context) {
        throw new Error("useGrid must be used within a GridProvider")
    }
    return context
}
