import { JSX, onMount } from "solid-js"
import { isDark, setIsDark } from "../stores/isDark"

import { A } from "@solidjs/router"
import darkModeIcon from "../../assets/moon.svg"
import lightModeIcon from "../../assets/sun.svg"

const NavHeader = (): JSX.Element => {
    onMount(() => {
        if (isDark()) {
            document.documentElement.classList.add("dark")
        }
    })

    /**
     * Swap between light and dark theme, saving the choice to local storage.
     */
    const toggleTheme = (): void => {
        document.documentElement.classList.toggle("dark")
        localStorage.setItem("theme", isDark() ? "light" : "dark")

        setIsDark(!isDark())
    }

    return (
        <header class="flex w-full items-center justify-between p-4 ">
            <h1 class="text-3xl font-bold">
                <A href="/">Seastar Visualizer</A>
            </h1>

            <button onClick={toggleTheme} class="ml-4 flex border-none">
                <img
                    src={isDark() ? lightModeIcon : darkModeIcon}
                    alt="change theme icon"
                    width="24"
                    height="24"
                />
            </button>
        </header>
    )
}

export default NavHeader
