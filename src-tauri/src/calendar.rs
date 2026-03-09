use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_opener::OpenerExt;
use uuid::Uuid;

const GOOGLE_CLIENT_ID: &str = "179347643851-j0v6io9cq7jd1bkopgbl2prtu64oaip5.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET: &str = "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";
const GOOGLE_REDIRECT_URI: &str = "http://127.0.0.1:43821/google/callback";
const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_EVENTS_URL: &str = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const GOOGLE_SCOPE: &str = "https://www.googleapis.com/auth/calendar.readonly";
const CALLBACK_SUCCESS_HTML: &str = r#"<html><body style=\"font-family:Arial,sans-serif;padding:32px;\"><h2>Google Calendar connected</h2><p>You can return to Echo now.</p></body></html>"#;

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
struct CalendarStorage {
    google_tokens: Option<GoogleTokenResponse>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GoogleTokenResponse {
    access_token: String,
    expires_in: i64,
    refresh_token: Option<String>,
    scope: Option<String>,
    token_type: Option<String>,
    created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CalendarConnectionStatus {
    provider: String,
    connected: bool,
    email: Option<String>,
    expires_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CalendarEvent {
    id: String,
    title: String,
    start: Option<String>,
    end: Option<String>,
    location: Option<String>,
    description: Option<String>,
    html_link: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleEventsResponse {
    items: Vec<GoogleEventItem>,
}

#[derive(Debug, Deserialize)]
struct GoogleEventItem {
    id: String,
    summary: Option<String>,
    location: Option<String>,
    description: Option<String>,
    #[serde(rename = "htmlLink")]
    html_link: Option<String>,
    start: Option<GoogleEventDateTime>,
    end: Option<GoogleEventDateTime>,
}

#[derive(Debug, Deserialize)]
struct GoogleEventDateTime {
    date: Option<String>,
    #[serde(rename = "dateTime")]
    date_time: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleTokenExchangeResponse {
    access_token: String,
    expires_in: i64,
    refresh_token: Option<String>,
    scope: Option<String>,
    token_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleUserInfo {
    email: Option<String>,
}

fn get_calendar_storage_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    Ok(app_data_dir.join("calendar_storage.json"))
}

fn load_calendar_storage(app: &AppHandle) -> Result<CalendarStorage, String> {
    let storage_path = get_calendar_storage_path(app)?;
    if !storage_path.exists() {
        return Ok(CalendarStorage::default());
    }

    let content = fs::read_to_string(&storage_path)
        .map_err(|e| format!("Failed to read calendar storage: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse calendar storage: {}", e))
}

fn save_calendar_storage(app: &AppHandle, storage: &CalendarStorage) -> Result<(), String> {
    let storage_path = get_calendar_storage_path(app)?;
    let content = serde_json::to_string(storage)
        .map_err(|e| format!("Failed to serialize calendar storage: {}", e))?;

    fs::write(storage_path, content)
        .map_err(|e| format!("Failed to write calendar storage: {}", e))
}

fn now_unix() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::from_secs(0))
        .as_secs() as i64
}

fn generate_pkce_verifier() -> String {
    URL_SAFE_NO_PAD.encode(Uuid::new_v4().as_bytes())
}

fn generate_pkce_challenge(verifier: &str) -> String {
    let digest = Sha256::digest(verifier.as_bytes());
    URL_SAFE_NO_PAD.encode(digest)
}

fn read_callback_request(listener: TcpListener) -> Result<(String, String), String> {
    let (mut stream, _) = listener
        .accept()
        .map_err(|e| format!("Failed to accept OAuth callback: {}", e))?;

    let mut buffer = [0; 4096];
    let bytes_read = stream
        .read(&mut buffer)
        .map_err(|e| format!("Failed to read OAuth callback: {}", e))?;
    let request = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
    let first_line = request
        .lines()
        .next()
        .ok_or("OAuth callback request was empty".to_string())?;

    let path = first_line
        .split_whitespace()
        .nth(1)
        .ok_or("OAuth callback path missing".to_string())?
        .to_string();

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Length: {}\r\n\r\n{}",
        CALLBACK_SUCCESS_HTML.len(),
        CALLBACK_SUCCESS_HTML
    );

    stream
        .write_all(response.as_bytes())
        .map_err(|e| format!("Failed to write OAuth callback response: {}", e))?;

    Ok((request, path))
}

fn extract_query_param(path: &str, key: &str) -> Option<String> {
    let query = path.split('?').nth(1)?;
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        let pair_key = parts.next()?;
        let pair_value = parts.next().unwrap_or_default();
        if pair_key == key {
            return Some(pair_value.replace("%2F", "/").replace("%3A", ":").replace("%40", "@").replace('+', " "));
        }
    }
    None
}

async fn exchange_google_code(code: &str, verifier: &str) -> Result<GoogleTokenResponse, String> {
    let client = Client::new();
    let params = [
        ("client_id", GOOGLE_CLIENT_ID),
        ("client_secret", GOOGLE_CLIENT_SECRET),
        ("code", code),
        ("code_verifier", verifier),
        ("grant_type", "authorization_code"),
        ("redirect_uri", GOOGLE_REDIRECT_URI),
    ];

    let response = client
        .post(GOOGLE_TOKEN_URL)
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Failed to exchange Google auth code: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Google token exchange failed: {}", error_text));
    }

    let token_response: GoogleTokenExchangeResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google token response: {}", e))?;

    Ok(GoogleTokenResponse {
        access_token: token_response.access_token,
        expires_in: token_response.expires_in,
        refresh_token: token_response.refresh_token,
        scope: token_response.scope,
        token_type: token_response.token_type,
        created_at: now_unix(),
    })
}

async fn fetch_google_user_email(access_token: &str) -> Result<Option<String>, String> {
    let client = Client::new();
    let response = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch Google user info: {}", e))?;

    if !response.status().is_success() {
        return Ok(None);
    }

    let user: GoogleUserInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google user info: {}", e))?;

    Ok(user.email)
}

async fn ensure_google_access_token(app: &AppHandle) -> Result<GoogleTokenResponse, String> {
    let storage = load_calendar_storage(app)?;
    let tokens = storage
        .google_tokens
        .ok_or("Google Calendar is not connected".to_string())?;

    if tokens.created_at + tokens.expires_in - 60 > now_unix() {
        return Ok(tokens);
    }

    let refresh_token = tokens
        .refresh_token
        .clone()
        .ok_or("Google refresh token is missing. Please reconnect your account.".to_string())?;

    let client = Client::new();
    let params = [
        ("client_id", GOOGLE_CLIENT_ID),
        ("client_secret", GOOGLE_CLIENT_SECRET),
        ("grant_type", "refresh_token"),
        ("refresh_token", refresh_token.as_str()),
    ];

    let response = client
        .post(GOOGLE_TOKEN_URL)
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Failed to refresh Google token: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Google token refresh failed: {}", error_text));
    }

    let refreshed: GoogleTokenExchangeResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google refresh response: {}", e))?;

    let merged = GoogleTokenResponse {
        access_token: refreshed.access_token,
        expires_in: refreshed.expires_in,
        refresh_token: refreshed.refresh_token.or(tokens.refresh_token),
        scope: refreshed.scope,
        token_type: refreshed.token_type,
        created_at: now_unix(),
    };

    let mut storage = load_calendar_storage(app)?;
    storage.google_tokens = Some(merged.clone());
    save_calendar_storage(app, &storage)?;

    Ok(merged)
}

#[tauri::command]
pub async fn calendar_begin_google_auth(
    app: AppHandle,
) -> Result<(), String> {
    let listener = TcpListener::bind("127.0.0.1:43821")
        .map_err(|e| format!("Failed to bind Google callback listener on port 43821: {}", e))?;

    let verifier = generate_pkce_verifier();
    let challenge = generate_pkce_challenge(&verifier);
    let oauth_state = Uuid::new_v4().to_string();

    let expected_state = oauth_state.clone();
    let verifier_for_task = verifier.clone();

    let app_for_task = app.clone();
    tauri::async_runtime::spawn(async move {
        let callback_result = read_callback_request(listener)
            .and_then(|(_, path)| {
                let code = extract_query_param(&path, "code")
                    .ok_or("Missing Google OAuth code in callback".to_string())?;
                let returned_state = extract_query_param(&path, "state")
                    .ok_or("Missing Google OAuth state in callback".to_string())?;
                Ok((code, returned_state))
            });

        let result: Result<(), String> = async {
            let (code, returned_state) = callback_result?;

            if returned_state != expected_state {
                return Err("Google OAuth state mismatch".to_string());
            }

            let tokens = exchange_google_code(&code, &verifier_for_task).await?;
            let mut storage = load_calendar_storage(&app_for_task)?;
            storage.google_tokens = Some(tokens);
            save_calendar_storage(&app_for_task, &storage)?;
            Ok(())
        }
        .await;

        let _ = app_for_task.emit("google-calendar-auth-complete", result.clone());
    });

    let auth_url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent&state={}&code_challenge={}&code_challenge_method=S256",
        GOOGLE_AUTH_URL,
        GOOGLE_CLIENT_ID,
        urlencoding::encode(GOOGLE_REDIRECT_URI),
        urlencoding::encode(GOOGLE_SCOPE),
        oauth_state,
        challenge,
    );

    app.opener()
        .open_url(auth_url, None::<String>)
        .map_err(|e| format!("Failed to open Google sign-in: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn calendar_get_google_status(app: AppHandle) -> Result<CalendarConnectionStatus, String> {
    let storage = load_calendar_storage(&app)?;
    let Some(tokens) = storage.google_tokens else {
        return Ok(CalendarConnectionStatus {
            provider: "google".to_string(),
            connected: false,
            email: None,
            expires_at: None,
        });
    };

    let email = fetch_google_user_email(&tokens.access_token).await.unwrap_or(None);

    Ok(CalendarConnectionStatus {
        provider: "google".to_string(),
        connected: true,
        email,
        expires_at: Some(tokens.created_at + tokens.expires_in),
    })
}

#[tauri::command]
pub async fn calendar_disconnect_google(app: AppHandle) -> Result<(), String> {
    let mut storage = load_calendar_storage(&app)?;
    storage.google_tokens = None;
    save_calendar_storage(&app, &storage)
}

#[tauri::command]
pub async fn calendar_sync_google_events(app: AppHandle) -> Result<Vec<CalendarEvent>, String> {
    let tokens = ensure_google_access_token(&app).await?;
    let client = Client::new();
    let time_min = chrono::Utc::now().to_rfc3339();

    let response = client
        .get(GOOGLE_CALENDAR_EVENTS_URL)
        .bearer_auth(tokens.access_token)
        .query(&[
            ("singleEvents", "true"),
            ("orderBy", "startTime"),
            ("maxResults", "25"),
            ("timeMin", time_min.as_str()),
        ])
        .send()
        .await
        .map_err(|e| format!("Failed to fetch Google Calendar events: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Google Calendar sync failed: {}", error_text));
    }

    let payload: GoogleEventsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google Calendar events: {}", e))?;

    Ok(payload
        .items
        .into_iter()
        .map(|event| CalendarEvent {
            id: event.id,
            title: event.summary.unwrap_or_else(|| "Untitled event".to_string()),
            start: event
                .start
                .and_then(|value| value.date_time.or(value.date)),
            end: event.end.and_then(|value| value.date_time.or(value.date)),
            location: event.location,
            description: event.description,
            html_link: event.html_link,
        })
        .collect())
}
