use axum::{
    body::Body,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;
use tracing::error;

#[derive(Debug)]
pub struct AppError {
    status_code: StatusCode,
    message: String,
}

impl AppError {
    pub fn new(status_code: StatusCode, message: &str) -> Self {
        Self {
            status_code,
            message: message.to_string(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let body = json!({
            "error": self.message
        });

        Response::builder()
            .status(self.status_code)
            .body(Body::from(serde_json::to_vec(&body).unwrap_or_default()))
            .unwrap_or_default()
    }
}

impl<E> From<E> for AppError
where
    E: std::error::Error,
{
    fn from(e: E) -> Self {
        error!(target: "server", "error: {}", e);

        Self::new(StatusCode::INTERNAL_SERVER_ERROR, "")
    }
}
