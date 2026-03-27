<?php
/**
 * GET /php/messages/get-thread.php?with=USER_ID[&product_id=X]
 * Returns all messages between the current user and the specified user,
 * optionally scoped to a product. Also marks incoming messages as read.
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

$uid        = currentUserId();
$otherId    = (int) ($_GET['with'] ?? 0);
$productId  = isset($_GET['product_id']) && (int) $_GET['product_id'] > 0
                ? (int) $_GET['product_id']
                : null;

if ($otherId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid user id']);
    exit;
}

$db = getDB();

// Verify the other user exists
$chk = $db->prepare('SELECT username FROM Users WHERE user_id = ?');
$chk->execute([$otherId]);
$otherUser = $chk->fetch();
if (!$otherUser) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
}

// Fetch messages in thread
$stmt = $db->prepare(
    'SELECT m.message_id,
            m.sender_id,
            u.username AS sender_name,
            m.body,
            m.is_read,
            m.sent_at
     FROM   Messages m
     JOIN   Users u ON u.user_id = m.sender_id
     WHERE  ((m.sender_id = ? AND m.receiver_id = ?)
             OR (m.sender_id = ? AND m.receiver_id = ?))
       AND  (m.product_id <=> ?)
     ORDER BY m.sent_at ASC'
);
$stmt->execute([$uid, $otherId, $otherId, $uid, $productId]);
$messages = $stmt->fetchAll();

// Mark messages from the other user as read
$markRead = $db->prepare(
    'UPDATE Messages
     SET    is_read = 1
     WHERE  receiver_id = ?
       AND  sender_id   = ?
       AND  (product_id <=> ?)'
);
$markRead->execute([$uid, $otherId, $productId]);

echo json_encode([
    'messages'       => $messages,
    'other_id'       => $otherId,
    'other_username' => $otherUser['username'],
]);
