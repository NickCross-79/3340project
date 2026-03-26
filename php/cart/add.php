<?php
require_once '../config/db.php';
require_once '../config/session.php';

requireLogin('../../html/login.html');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../html/product.html');
    exit;
}

$productId = (int) ($_POST['product_id'] ?? 0);
$quantity  = (int) ($_POST['quantity']   ?? 1);

if ($productId <= 0 || $quantity < 1) {
    header('Location: ../../html/product.html?error=invalid_input');
    exit;
}

$db = getDB();

// Verify the product exists and is available
$stmt = $db->prepare('SELECT product_id FROM Products WHERE product_id = ? AND status = "Available"');
$stmt->execute([$productId]);
if (!$stmt->fetch()) {
    header('Location: ../../html/product.html?error=unavailable');
    exit;
}

$userId = currentUserId();

// Upsert: increment quantity if already in cart, otherwise insert
$stmt = $db->prepare(
    'INSERT INTO Cart_Items (user_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)'
);
$stmt->execute([$userId, $productId, $quantity]);

header('Location: ../../html/cart.html');
exit;
