<?php
/**
 * POST /php/admin/update-listing.php
 * Updates editable fields of a product listing. Admin only.
 * Body (JSON): product_id, title?, description?, price?, status?, condition_status?, cat_id?
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

$productId = (int) ($body['product_id'] ?? 0);
if ($productId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid product_id']);
    exit;
}

$db     = getDB();
$fields = [];
$params = [];

$allowedStatuses    = ['Available', 'Sold', 'Archived'];
$allowedConditions  = ['New', 'Like New', 'Good', 'Fair', 'For Parts'];

if (isset($body['title']) && trim($body['title']) !== '') {
    $fields[] = 'title = ?';
    $params[] = trim($body['title']);
}
if (isset($body['description'])) {
    $fields[] = 'description = ?';
    $params[] = trim($body['description']);
}
if (isset($body['price'])) {
    $price = (float) $body['price'];
    if ($price < 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Price cannot be negative']);
        exit;
    }
    $fields[] = 'price = ?';
    $params[] = $price;
}
if (isset($body['status']) && in_array($body['status'], $allowedStatuses, true)) {
    $fields[] = 'status = ?';
    $params[] = $body['status'];
}
if (isset($body['condition_status']) && in_array($body['condition_status'], $allowedConditions, true)) {
    $fields[] = 'condition_status = ?';
    $params[] = $body['condition_status'];
}
if (isset($body['cat_id'])) {
    $fields[] = 'cat_id = ?';
    $params[] = (int) $body['cat_id'] ?: null;
}

if (empty($fields)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nothing to update']);
    exit;
}

$params[] = $productId;
$sql      = 'UPDATE Products SET ' . implode(', ', $fields) . ' WHERE product_id = ?';
$db->prepare($sql)->execute($params);

echo json_encode(['success' => true]);
