<?php
/**
 * GET /php/listings/get-product.php?id=X
 * Returns full details for a single product listing.
 */

require_once '../config/db.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid product ID']);
    exit;
}

$db   = getDB();
$stmt = $db->prepare(
    'SELECT p.product_id,
            p.title,
            p.description,
            p.price,
            p.condition_status,
            p.image_url,
            p.status,
            p.created_at,
            p.seller_id,
            u.username   AS seller,
            u.location   AS seller_location,
            c.cat_name
     FROM   Products p
     JOIN   Users u       ON p.seller_id = u.user_id
     LEFT JOIN Categories c ON p.cat_id  = c.cat_id
     WHERE  p.product_id = ?'
);
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product) {
    http_response_code(404);
    echo json_encode(['error' => 'Product not found']);
    exit;
}

echo json_encode(['product' => $product]);
