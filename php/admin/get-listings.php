<?php
/**
 * GET /php/admin/get-listings.php
 * Returns all product listings with seller info. Admin only.
 * Optional query params: q (search), status, limit, offset
 */

require_once '../config/db.php';
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

requireAdmin();

$db     = getDB();
$limit  = min(100, max(1, (int) ($_GET['limit']  ?? 50)));
$offset = max(0,           (int) ($_GET['offset'] ?? 0));
$q      = trim($_GET['q'] ?? '');
$status = $_GET['status'] ?? '';

$where  = [];
$params = [];

if ($q !== '') {
    $where[]  = '(p.title LIKE ? OR p.description LIKE ? OR u.username LIKE ?)';
    $like     = '%' . $q . '%';
    $params   = array_merge($params, [$like, $like, $like]);
}

$allowed = ['Available', 'Sold', 'Archived'];
if (in_array($status, $allowed, true)) {
    $where[]  = 'p.status = ?';
    $params[] = $status;
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$sql = "SELECT p.product_id, p.title, p.description, p.price,
               p.status, p.condition_status, p.image_url,
               p.created_at, p.cat_id,
               c.cat_name,
               u.user_id AS seller_id, u.username AS seller
        FROM   Products p
        JOIN   Users    u ON p.seller_id = u.user_id
        LEFT JOIN Categories c ON p.cat_id = c.cat_id
        $whereClause
        ORDER  BY p.created_at DESC
        LIMIT  $limit OFFSET $offset";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$listings = $stmt->fetchAll();

// Total count
$countSql  = "SELECT COUNT(*) FROM Products p JOIN Users u ON p.seller_id = u.user_id $whereClause";
$cStmt     = $db->prepare($countSql);
$cStmt->execute($params);
$total = (int) $cStmt->fetchColumn();

// Categories for edit dropdowns
$cats = $db->query('SELECT cat_id, cat_name FROM Categories ORDER BY cat_name')->fetchAll();

echo json_encode(['listings' => $listings, 'total' => $total, 'categories' => $cats]);
