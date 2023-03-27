import ExternalLink from "./ExternalLink"
import { JSX } from "solid-js"

export const Footer = (): JSX.Element => {
    return (
        <footer class="flex w-full flex-col items-center gap-1 p-2">
            <div class="flex gap-4">
                <ExternalLink to="https://github.com/robertwayne/seastar-visualizer">
                    Visualizer Code
                </ExternalLink>
                <ExternalLink to="https://github.com/robertwayne/seastar">
                    Library Code
                </ExternalLink>
            </div>

            <span>&copy; {new Date().getFullYear()} Rob Wagner</span>
        </footer>
    )
}
