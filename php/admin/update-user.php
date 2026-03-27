<?php
/**
 * POST /php/admin/update-user.php
 * Admin can disable/enable accounts or toggle admin status for another user.
 * Body (JSON or form): user_id, is_disabled?, is_admin?
 */

require_once '../config/db.php';
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

requireAdmin();

$body = json_decode(file_get_contents('php://input'), true) ?? [];
if (empty($body)) {
    $body = $_POST;
}

$targetId = (int) ($body['user_id'] ?? 0);
if ($targetId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user_id']);
    exit;
}

// Prevent admin from disabling themselves
if ($targetId === currentUserId() && isset($body['is_disabled']) && (int)$body['is_disabled'] === 1) {
    http_response_code(400);
    echo json_encode(['error' => 'You cannot disable your own account']);
    exit;
}

$db     = getDB();
$fields = [];
$params = [];

if (isset($body['is_disabled'])) {
    $fields[] = 'is_disabled = ?';
    $params[]  = (int)(bool)$body['is_disabled'];
}
if (isset($body['is_admin'])) {
    $fields[] = 'is_admin = ?';
    $params[]  = (int)(bool)$body['is_admin'];
}

if (empty($fields)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nothing to update']);
    exit;
}

$params[] = $targetId;
$sql      = 'UPDATE Users SET ' . implode(', ', $fields) . ' WHERE user_id = ?';
$db->prepare($sql)->execute($params);

echo json_encode(['success' => true]);
