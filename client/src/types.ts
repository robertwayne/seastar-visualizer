export interface Size {
    rows: number
    cols: number
}

export interface Position {
    x: number
    y: number
}

export const COLORS = {
    START: "#6d8c32",
    END: "#94353d",
    WALL: "#2f2b5c",
    PATH: "#d1b48c",
} as const
