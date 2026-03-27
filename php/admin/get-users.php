<?php
/**
 * GET /php/admin/get-users.php
 * Returns all users for admin management. Admin only.
 */

require_once '../config/db.php';
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

requireAdmin();

$db   = getDB();
$stmt = $db->query(
    'SELECT user_id, username, email, phone, location, bio,
            is_admin, is_disabled, created_at
     FROM   Users
     ORDER  BY created_at DESC'
);
$users = $stmt->fetchAll();

echo json_encode(['users' => $users]);
