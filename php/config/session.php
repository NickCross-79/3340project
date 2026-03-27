<?php
/**
 * Session management helpers.
 * Include this in every PHP script that needs authentication.
 */

function startSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        // Harden session cookie
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => false,   // Set to true when serving over HTTPS
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_start();
    }
}

/**
 * Redirect to login page if the user is not authenticated.
 */
function requireLogin(string $redirect = '../../html/login.html'): void {
    startSession();
    if (empty($_SESSION['user_id'])) {
        header('Location: ' . $redirect);
        exit;
    }
}

function isLoggedIn(): bool {
    startSession();
    return !empty($_SESSION['user_id']);
}

function currentUserId(): ?int {
    startSession();
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function currentUsername(): ?string {
    startSession();
    return $_SESSION['username'] ?? null;
}

function isAdmin(): bool {
    startSession();
    return !empty($_SESSION['is_admin']);
}

function requireAdmin(): void {
    startSession();
    if (!isLoggedIn()) {
        http_response_code(401);
        header('Content-Type: application/json');
        exit(json_encode(['error' => 'Not authenticated']));
    }
    if (!isAdmin()) {
        http_response_code(403);
        header('Content-Type: application/json');
        exit(json_encode(['error' => 'Admin access required']));
    }
}
