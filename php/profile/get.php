<?php
/**
 * GET /php/profile/get.php
 * Returns the current user's profile info and recent orders as JSON.
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

$db     = getDB();
$userId = currentUserId();

// User info
$stmt = $db->prepare('SELECT username, email, phone, location, bio, profile_pic, created_at FROM Users WHERE user_id = ?');
$stmt->execute([$userId]);
$user = $stmt->fetch();

// Active listings
$stmt = $db->prepare(
    'SELECT product_id, title, price, status, created_at
     FROM   Products
     WHERE  seller_id = ?
     ORDER BY created_at DESC
     LIMIT 20'
);
$stmt->execute([$userId]);
$listings = $stmt->fetchAll();

// Recent orders
$stmt = $db->prepare(
    'SELECT o.order_id, o.total_amount, o.status, o.created_at
     FROM   Orders o
     WHERE  o.buyer_id = ?
     ORDER BY o.created_at DESC
     LIMIT 20'
);
$stmt->execute([$userId]);
$orders = $stmt->fetchAll();

echo json_encode([
    'user'     => $user,
    'listings' => $listings,
    'orders'   => $orders,
]);
