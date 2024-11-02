#![forbid(unsafe_code)]

mod error;
mod handlers;

use std::{net::SocketAddr, time::Duration};

use axum::{
    extract::Request,
    http::{
        header::{ACCEPT, CACHE_CONTROL, CONTENT_TYPE},
        HeaderValue, Method,
    },
    middleware::{self, Next},
    response::Response,
    routing::post,
    Router,
};
use error::AppError;
use handlers::get_path;
use mimalloc::MiMalloc;
use tower_http::{
    compression::{predicate::SizeAbove, CompressionLayer},
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
    CompressionLevel,
};
use tracing::Level;
use tracing_subscriber::{filter, layer::SubscriberExt, util::SubscriberInitExt};

#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), AppError> {
    let filter = filter::Targets::new()
        .with_default(Level::INFO)
        .with_target("tower_http", Level::WARN)
        .with_target("server", Level::DEBUG)
        .with_target("tokio_postgres", Level::WARN);

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(filter)
        .init();

    let addr = SocketAddr::from(([127, 0, 0, 1], 3222));
    let router = Router::new()
        .nest("/api", api_handler())
        .merge(static_file_handler());

    tracing::info!(target: "server", "listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    axum::serve(
        listener,
        router
            .layer(
                CorsLayer::new()
                    .allow_headers([ACCEPT, CONTENT_TYPE])
                    .max_age(Duration::from_secs(86400))
                    .allow_origin(
                        std::env::var("CORS_ORIGIN")
                            .unwrap_or_else(|_| "*".to_string())
                            .parse::<HeaderValue>()?,
                    )
                    .allow_methods(vec![Method::GET, Method::POST]),
            )
            .layer(
                CompressionLayer::new()
                    .quality(CompressionLevel::Precise(4))
                    .compress_when(SizeAbove::new(512)),
            )
            .layer(TraceLayer::new_for_http())
            .into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}

fn static_file_handler() -> Router {
    Router::new()
        .nest_service(
            "/",
            ServeDir::new("dist").not_found_service(ServeFile::new("dist/index.html")),
        )
        .layer(middleware::from_fn(cache_control))
}

fn api_handler() -> Router {
    Router::new().route("/astar", post(get_path))
}

async fn cache_control(request: Request, next: Next) -> Response {
    let mut response = next.run(request).await;

    if let Some(content_type) = response.headers().get(CONTENT_TYPE) {
        const CACHEABLE_CONTENT_TYPES: [&str; 6] = [
            "text/css",
            "application/javascript",
            "image/svg+xml",
            "image/webp",
            "font/woff2",
            "image/png",
        ];

        if CACHEABLE_CONTENT_TYPES.iter().any(|&ct| content_type == ct) {
            let value = format!("public, max-age={}", 60 * 60 * 24);

            if let Ok(value) = HeaderValue::from_str(&value) {
                response.headers_mut().insert(CACHE_CONTROL, value);
            }
        }
    }

    response
}
