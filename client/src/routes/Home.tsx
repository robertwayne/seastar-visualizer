import { ColorKey } from "../components/ColorKey"
import { Controls } from "../components/Controls"
import { Canvas } from "../components/Canvas"
import { GridProvider } from "../context/GridContext"
import { StatusText } from "../components/StatusText"

const Home = () => {
    let canvasRef: HTMLCanvasElement

    return (
        <GridProvider>
            <div class="h-full w-full flex flex-col gap-4">
                <Canvas ref={canvasRef!} />
                <StatusText />
                <div class="flex flex-col md:flex-row gap-4 h-fit">
                    <ColorKey />
                    <Controls canvas={canvasRef!} />
                </div>
            </div>
        </GridProvider>
    )
}

export default Home
