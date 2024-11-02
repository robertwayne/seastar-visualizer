import "./index.css"

import { App } from "./App"
import { Route, Router } from "@solidjs/router"
import { render } from "solid-js/web"
import { lazy } from "solid-js"

const Home = lazy(() => import("./routes/Home"))
const NotFound = lazy(() => import("./routes/NotFound"))

const app = document.getElementById("app")
if (app) {
    render(
        () => (
            <Router root={App}>
                <Route path="/" component={Home} />
                <Route path="*" component={NotFound} />
            </Router>
        ),
        app,
    )
}
