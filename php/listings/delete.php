<?php
/**
 * Delete Listing
 * --------------
 * Verifies that the authenticated user is the original seller of the
 * specified product before deleting it, preventing unauthorised removal
 * of other users' listings.
 *
 * Method : POST
 * Route  : /php/listings/delete.php
 * Auth   : Required — redirects to login.html if not authenticated
 * Input  : product_id (int)
 * Redirects to profile.html?success=listing_deleted on success.
 */
require_once '../config/db.php';
require_once '../config/session.php';

requireLogin('../../html/login.html');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$productId = (int) ($_POST['product_id'] ?? 0);
if ($productId <= 0) {
    header('Location: ../../html/profile.html?error=invalid_id');
    exit;
}

$db   = getDB();
$stmt = $db->prepare('SELECT seller_id FROM Products WHERE product_id = ?');
$stmt->execute([$productId]);
$product = $stmt->fetch();

if (!$product) {
    header('Location: ../../html/profile.html?error=not_found');
    exit;
}

// Only the seller may delete their own listing
if ((int) $product['seller_id'] !== currentUserId()) {
    http_response_code(403);
    header('Location: ../../html/profile.html?error=forbidden');
    exit;
}

$db->prepare('DELETE FROM Products WHERE product_id = ?')->execute([$productId]);

header('Location: ../../html/profile.html?success=listing_deleted');
exit;
