<?php
/**
 * POST /php/messages/send.php
 * Send a message to another user.
 * Body params: receiver_id (int), body (string), product_id (int, optional)
 * Requires login; returns 401 if not authenticated.
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$senderId   = currentUserId();
$receiverId = (int) ($_POST['receiver_id'] ?? 0);
$productId  = isset($_POST['product_id']) && (int) $_POST['product_id'] > 0
                ? (int) $_POST['product_id']
                : null;
$body       = trim($_POST['body'] ?? '');

if ($receiverId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid receiver']);
    exit;
}

if ($senderId === $receiverId) {
    http_response_code(400);
    echo json_encode(['error' => 'Cannot message yourself']);
    exit;
}

if ($body === '' || mb_strlen($body) > 2000) {
    http_response_code(400);
    echo json_encode(['error' => 'Message body must be between 1 and 2000 characters']);
    exit;
}

$db = getDB();

// Verify receiver exists
$chk = $db->prepare('SELECT user_id FROM Users WHERE user_id = ?');
$chk->execute([$receiverId]);
if (!$chk->fetch()) {
    http_response_code(404);
    echo json_encode(['error' => 'Recipient not found']);
    exit;
}

$stmt = $db->prepare(
    'INSERT INTO Messages (sender_id, receiver_id, product_id, body)
     VALUES (?, ?, ?, ?)'
);
$stmt->execute([$senderId, $receiverId, $productId, $body]);

echo json_encode(['success' => true, 'message_id' => (int) $db->lastInsertId()]);
