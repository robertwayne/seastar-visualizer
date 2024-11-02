use axum::{http::StatusCode, Json};
use seastar::{astar, Grid, Point};
use serde::{Deserialize, Serialize};

use crate::error::AppError;

#[derive(Debug, Deserialize)]
pub struct PathRequestForm {
    width: usize,
    height: usize,
    #[serde(rename = "startX")]
    start_x: usize,
    #[serde(rename = "startY")]
    start_y: usize,
    #[serde(rename = "endX")]
    end_x: usize,
    #[serde(rename = "endY")]
    end_y: usize,
    walls: Vec<Point>,
}

#[derive(Debug, Serialize)]
pub struct PathResponse {
    path: Vec<Point>,
}

pub async fn get_path(
    Json(payload): Json<PathRequestForm>,
) -> Result<Json<PathResponse>, AppError> {
    if payload.width <= 0 || payload.height <= 0 {
        return Err(AppError::new(
            StatusCode::BAD_REQUEST,
            "Invalid width or height",
        ));
    }

    if payload.width > 30 || payload.height > 30 {
        return Err(AppError::new(StatusCode::BAD_REQUEST, "Grid too large"));
    }

    if payload.start_x >= payload.width || payload.start_y >= payload.height {
        return Err(AppError::new(
            StatusCode::BAD_REQUEST,
            "Invalid start point",
        ));
    }

    if payload.end_x >= payload.width || payload.end_y >= payload.height {
        return Err(AppError::new(StatusCode::BAD_REQUEST, "Invalid end point"));
    }

    let start = Point::new(payload.start_x as isize, payload.start_y as isize);
    let end = Point::new(payload.end_x as isize, payload.end_y as isize);
    let mut grid = Grid::new(payload.width, payload.height);

    for wall in payload.walls {
        grid.set(wall.x, wall.y, true);
    }

    if let Some(path) = astar(&grid, start, end) {
        Ok(Json(PathResponse { path }))
    } else {
        Ok(Json(PathResponse { path: Vec::new() }))
    }
}
