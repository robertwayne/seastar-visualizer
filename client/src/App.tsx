import { ParentProps } from "solid-js"
import NavHeader from "./components/NavHeader"

export const App = (props: ParentProps) => {
    return (
        <div class="h-screen w-full flex flex-col bg-[var(--primary)] text-[var(--secondary)] transition overflow-hidden">
            <NavHeader />
            <main class="flex-1 w-full max-w-screen-2xl mx-auto p-4 overflow-hidden">
                {props.children}
            </main>
        </div>
    )
}
