<?php
require_once '../config/db.php';
require_once '../config/session.php';

requireLogin('../../html/login.html');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../html/checkout.html');
    exit;
}

$fullName = trim($_POST['fullName'] ?? '');
$email    = trim($_POST['email']    ?? '');
$address  = trim($_POST['address']  ?? '');
$city     = trim($_POST['city']     ?? '');
$postal   = trim($_POST['postal']   ?? '');
$delivery = $_POST['delivery']       ?? '';
$payment  = $_POST['payment']        ?? '';

if ($fullName === '' || $email === '' || $address === '' || $city === '' || $postal === '' || $delivery === '' || $payment === '') {
    header('Location: ../../html/checkout.html?error=missing_fields');
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../../html/checkout.html?error=invalid_email');
    exit;
}

$allowedDelivery = ['Delivery', 'Pickup'];
$allowedPayment  = ['Credit Card', 'Debit Card', 'Cash on Pickup'];

if (!in_array($delivery, $allowedDelivery, true) || !in_array($payment, $allowedPayment, true)) {
    header('Location: ../../html/checkout.html?error=invalid_option');
    exit;
}

$db     = getDB();
$userId = currentUserId();

// Fetch the user's current cart
$stmt = $db->prepare(
    'SELECT ci.product_id, ci.quantity, p.price
     FROM   Cart_Items ci
     JOIN   Products p ON ci.product_id = p.product_id
     WHERE  ci.user_id = ? AND p.status = "Available"'
);
$stmt->execute([$userId]);
$cartItems = $stmt->fetchAll();

if (empty($cartItems)) {
    header('Location: ../../html/cart.html?error=empty_cart');
    exit;
}

$total = array_sum(array_map(fn($i) => (float) $i['price'] * (int) $i['quantity'], $cartItems));

$db->beginTransaction();
try {
    // Insert order header
    $stmt = $db->prepare(
        'INSERT INTO Orders (buyer_id, full_name, email, address, city, postal_code,
                             delivery_method, payment_method, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $fullName, $email, $address, $city, $postal, $delivery, $payment, $total]);
    $orderId = (int) $db->lastInsertId();

    // Insert order lines and mark products as sold
    $itemStmt = $db->prepare(
        'INSERT INTO Order_Items (order_id, product_id, quantity, price_at_purchase)
         VALUES (?, ?, ?, ?)'
    );
    $soldStmt = $db->prepare('UPDATE Products SET status = "Sold" WHERE product_id = ?');

    foreach ($cartItems as $item) {
        $itemStmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
        $soldStmt->execute([$item['product_id']]);
    }

    // Clear the cart
    $db->prepare('DELETE FROM Cart_Items WHERE user_id = ?')->execute([$userId]);

    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    header('Location: ../../html/checkout.html?error=order_failed');
    exit;
}

header('Location: ../../html/profile.html?success=order_placed&order=' . $orderId);
exit;
