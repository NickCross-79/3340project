<?php
/**
 * GET /php/cart/get.php
 * Returns the current user's cart items as JSON.
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

$db   = getDB();
$stmt = $db->prepare(
    'SELECT ci.product_id,
            ci.quantity,
            p.title,
            p.price,
            p.image_url,
            p.condition_status,
            p.status AS availability
     FROM   Cart_Items ci
     JOIN   Products p ON ci.product_id = p.product_id
     WHERE  ci.user_id = ?
     ORDER BY ci.added_at DESC'
);
$stmt->execute([currentUserId()]);
$items = $stmt->fetchAll();

$subtotal = array_sum(array_map(fn($i) => (float) $i['price'] * (int) $i['quantity'], $items));
$tax      = round($subtotal * 0.13, 2);

echo json_encode([
    'items'    => $items,
    'subtotal' => $subtotal,
    'tax'      => $tax,
    'total'    => round($subtotal + $tax, 2),
]);
