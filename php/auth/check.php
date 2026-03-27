<?php
/**
 * Auth Check
 * ----------
 * Returns a JSON payload describing the current session's auth state.
 * Called by scripts.js after every page load to show/hide auth-gated
 * navigation elements (Sell, Admin, profile icon, logout).
 *
 * Method   : GET
 * Route    : /php/auth/check.php
 * Response : { loggedIn: bool, username?: string, userId?: int, isAdmin?: bool }
 */
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

startSession();

if (isLoggedIn()) {
    echo json_encode([
        'loggedIn' => true,
        'username' => currentUsername(),
        'userId'   => currentUserId(),
        'isAdmin'  => isAdmin(),
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
