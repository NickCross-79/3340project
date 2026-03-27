<?php
/**
 * POST /php/admin/toggle-admin.php
 * Demo: lets any logged-in user toggle their own is_admin flag.
 * Returns JSON with new is_admin value and updates the session.
 */

require_once '../config/db.php';
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

startSession();

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = currentUserId();
$db     = getDB();

// Fetch current flag
$stmt = $db->prepare('SELECT is_admin FROM Users WHERE user_id = ?');
$stmt->execute([$userId]);
$row = $stmt->fetch();

if (!$row) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

$newValue = $row['is_admin'] ? 0 : 1;

$upd = $db->prepare('UPDATE Users SET is_admin = ? WHERE user_id = ?');
$upd->execute([$newValue, $userId]);

// Keep session in sync
$_SESSION['is_admin'] = (bool) $newValue;

echo json_encode(['is_admin' => (bool) $newValue]);
