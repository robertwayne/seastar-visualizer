import { JSX } from "solid-js"

import { A } from "@solidjs/router"

const NavHeader = (): JSX.Element => {
    const links = [
        {
            name: "Library Code",
            to: "https://github.com/robertwayne/seastar",
        },
        {
            name: "Visualizer Code",
            to: "https://github.com/robertwayne/seastar-visualizer",
        },
    ]

    return (
        <header class="flex w-full items-center justify-between p-4 ">
            <h1 class="text-3xl font-bold">
                <A href="/">Seastar Visualizer</A>
            </h1>
        </header>
    )
}

export default NavHeader
