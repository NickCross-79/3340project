<?php
/**
 * GET /php/listings/get-listings.php
 * Returns a JSON array of available product listings.
 *
 * Query params (all optional):
 *   q          - search term (title / description)
 *   category   - category name (exact match)
 *   min_price  - minimum price
 *   max_price  - maximum price
 *   limit      - max results (default 20, max 100)
 *   offset     - pagination offset
 */

require_once '../config/db.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$db = getDB();

$search   = trim($_GET['q']         ?? '');
$category = trim($_GET['category']  ?? '');
$minPrice = $_GET['min_price']      ?? null;
$maxPrice = $_GET['max_price']      ?? null;
$limit    = min(max((int) ($_GET['limit']  ?? 20), 1), 100);
$offset   = max((int) ($_GET['offset'] ?? 0), 0);

$conditions = ['p.status = "Available"'];
$params     = [];

if ($search !== '') {
    $conditions[] = '(p.title LIKE ? OR p.description LIKE ?)';
    $params[]     = '%' . $search . '%';
    $params[]     = '%' . $search . '%';
}

if ($category !== '') {
    $conditions[] = 'c.cat_name = ?';
    $params[]     = $category;
}

if ($minPrice !== null && is_numeric($minPrice)) {
    $conditions[] = 'p.price >= ?';
    $params[]     = (float) $minPrice;
}

if ($maxPrice !== null && is_numeric($maxPrice)) {
    $conditions[] = 'p.price <= ?';
    $params[]     = (float) $maxPrice;
}

$where = 'WHERE ' . implode(' AND ', $conditions);

$sql = "SELECT p.product_id,
               p.title,
               p.price,
               p.condition_status,
               p.image_url,
               p.created_at,
               c.cat_name,
               u.username AS seller
        FROM   Products p
        JOIN   Users u      ON p.seller_id = u.user_id
        LEFT JOIN Categories c ON p.cat_id = c.cat_id
        $where
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?";

$params[] = $limit;
$params[] = $offset;

$stmt = $db->prepare($sql);
$stmt->execute($params);

echo json_encode(['products' => $stmt->fetchAll()]);
