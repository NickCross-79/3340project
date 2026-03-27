<?php
/**
 * POST /php/admin/delete-listing.php
 * Permanently deletes a product listing. Admin only.
 * Body (form or JSON): product_id
 */

require_once '../config/db.php';
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

requireAdmin();

$body      = json_decode(file_get_contents('php://input'), true) ?? [];
$productId = (int) ($body['product_id'] ?? $_POST['product_id'] ?? 0);

if ($productId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid product_id']);
    exit;
}

$db   = getDB();
$stmt = $db->prepare('DELETE FROM Products WHERE product_id = ?');
$stmt->execute([$productId]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Listing not found']);
    exit;
}

echo json_encode(['success' => true]);
