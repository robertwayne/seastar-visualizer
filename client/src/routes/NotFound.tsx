import { A } from "@solidjs/router"

const NotFound = () => {
    return (
        <div class="flex w-full flex-col items-center justify-center">
            <h2 class="mb-6 text-3xl font-bold">Page Not Found</h2>

            <A href="/">Return to Home</A>
        </div>
    )
}

export default NotFound
