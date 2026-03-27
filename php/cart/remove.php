<?php
/**
 * Remove from Cart
 * ----------------
 * Deletes a single product from the authenticated user's Cart_Items row.
 * After deletion the user is redirected back to the cart page.
 *
 * Method : POST
 * Route  : /php/cart/remove.php
 * Auth   : Required — redirects to login.html if not authenticated
 * Input  : product_id (int)
 */
require_once '../config/db.php';
require_once '../config/session.php';

requireLogin('../../html/login.html');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../html/cart.html');
    exit;
}

$productId = (int) ($_POST['product_id'] ?? 0);
if ($productId <= 0) {
    header('Location: ../../html/cart.html?error=invalid_id');
    exit;
}

$db   = getDB();
$stmt = $db->prepare('DELETE FROM Cart_Items WHERE user_id = ? AND product_id = ?');
$stmt->execute([currentUserId(), $productId]);

header('Location: ../../html/cart.html');
exit;
