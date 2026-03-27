<?php
/**
 * GET /php/messages/get-conversations.php
 * Returns a list of conversations for the current user.
 * A conversation is a unique (other_user, product) pair.
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

$uid = currentUserId();
$db  = getDB();

$stmt = $db->prepare(
    'SELECT
         c.other_id,
         u.username        AS other_username,
         c.product_id,
         p.title           AS product_title,
         c.last_at,
         c.unread,
         c.last_body
     FROM (
         SELECT
             IF(sender_id = ?, receiver_id, sender_id) AS other_id,
             product_id,
             MAX(sent_at)  AS last_at,
             SUM(is_read = 0 AND receiver_id = ?) AS unread,
             (SELECT m2.body
              FROM   Messages m2
              WHERE  ((m2.sender_id = ? AND m2.receiver_id = IF(m.sender_id = ?, m.receiver_id, m.sender_id))
                      OR (m2.sender_id = IF(m.sender_id = ?, m.receiver_id, m.sender_id) AND m2.receiver_id = ?))
                AND  (m2.product_id <=> m.product_id)
              ORDER BY m2.sent_at DESC
              LIMIT 1) AS last_body
         FROM   Messages m
         WHERE  sender_id = ? OR receiver_id = ?
         GROUP BY IF(sender_id = ?, receiver_id, sender_id), product_id
     ) c
     JOIN      Users    u ON u.user_id    = c.other_id
     LEFT JOIN Products p ON p.product_id = c.product_id
     ORDER BY c.last_at DESC'
);

$stmt->execute([$uid, $uid, $uid, $uid, $uid, $uid, $uid, $uid, $uid]);
$rows = $stmt->fetchAll();

echo json_encode(['conversations' => $rows]);
