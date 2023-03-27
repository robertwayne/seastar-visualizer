#![forbid(unsafe_code)]

mod cache_control;

use std::{error::Error, net::SocketAddr, time::Duration};

use axum::{
    http::{
        header::{ACCEPT, CONTENT_TYPE},
        HeaderValue, Method, StatusCode,
    },
    middleware,
    routing::post,
    Json, Router,
};
use seastar::{astar, Point};
use serde::{Deserialize, Serialize};
use tower_http::{
    compression::CompressionLayer,
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .compact()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let addr = SocketAddr::from(([127, 0, 0, 1], 3222));
    let assets_dir = std::env::var("ASSETS_DIR").unwrap_or_else(|_| "dist".to_string());

    let router = Router::new()
        .nest("/api", api_handler())
        .merge(static_file_handler(&assets_dir));

    tracing::debug!("listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(
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
                        .allow_methods(vec![
                            Method::GET,
                            Method::POST,
                            Method::PUT,
                            Method::DELETE,
                            Method::OPTIONS,
                            Method::HEAD,
                            Method::PATCH,
                        ]),
                )
                .layer(CompressionLayer::new())
                .layer(TraceLayer::new_for_http())
                .into_make_service(),
        )
        .await?;

    Ok(())
}

// Files returns from this route will have a cache-control header set if they
// meet the criteria.
fn static_file_handler(assets_dir: &str) -> Router {
    Router::new()
        .nest_service(
            "/",
            ServeDir::new(assets_dir)
                .not_found_service(ServeFile::new(format!("{assets_dir}/index.html"))),
        )
        .layer(middleware::from_fn(cache_control::set_cache_header))
}

fn api_handler() -> Router {
    Router::new().route("/astar", post(post_astar))
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq, Hash, Clone, Copy)]
struct RequestPoint {
    x: isize,
    y: isize,
}

impl From<Point> for RequestPoint {
    fn from(point: Point) -> Self {
        Self {
            x: point.x,
            y: point.y,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct PathRequestForm {
    width: isize,
    height: isize,
    #[serde(rename = "startX")]
    start_x: isize,
    #[serde(rename = "startY")]
    start_y: isize,
    #[serde(rename = "endX")]
    end_x: isize,
    #[serde(rename = "endY")]
    end_y: isize,
    walls: Vec<RequestPoint>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PathResponse {
    path: Vec<(isize, isize)>,
}

async fn post_astar(
    Json(payload): Json<PathRequestForm>,
) -> Result<Json<PathResponse>, StatusCode> {
    if payload.width < 1
        || payload.height < 1
        || payload.start_x < 0
        || payload.start_y < 0
        || payload.end_x < 0
        || payload.end_y < 0
        || payload.start_x >= payload.width
        || payload.start_y >= payload.height
        || payload.end_x >= payload.width
        || payload.end_y >= payload.height
        || payload.height > 100
        || payload.width > 100
    {
        return Err(StatusCode::BAD_REQUEST);
    }

    let start = Point {
        x: payload.start_x,
        y: payload.start_y,
    };
    let end = Point {
        x: payload.end_x,
        y: payload.end_y,
    };

    let mut grid = Vec::new();

    for i in 0..payload.width {
        let mut row = Vec::new();
        for j in 0..payload.height {
            if payload.walls.contains(&RequestPoint { x: i, y: j }) {
                row.push(Some(()))
            } else {
                row.push(None)
            }
        }

        grid.push(row);
    }

    if let Some(path) = astar(&grid, start, end) {
        Ok(Json(PathResponse {
            path: path
                .iter()
                .map(|point| (point.x, point.y))
                .collect::<Vec<(isize, isize)>>(),
        }))
    } else {
        Ok(Json(PathResponse { path: Vec::new() }))
    }
}
