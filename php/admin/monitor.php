<?php
/**
 * GET /php/admin/monitor.php
 * Returns server-side health data: DB connectivity, record counts, server info.
 * Client-side pings each API endpoint separately; this script handles only
 * what the browser cannot directly measure.  Admin only.
 */

require_once '../config/db.php';
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

requireAdmin();

$result = [];

// ── Database connectivity ──────────────────────────────────────────────────
try {
    $db = getDB();
    $t0 = microtime(true);
    $db->query('SELECT 1');
    $ms = round((microtime(true) - $t0) * 1000, 2);
    $result['database'] = ['status' => 'online', 'latency_ms' => $ms];
} catch (Throwable $e) {
    $result['database'] = ['status' => 'offline', 'latency_ms' => null];
}

// ── Record counts ──────────────────────────────────────────────────────────
$stats = ['products' => 0, 'users' => 0, 'orders' => 0, 'categories' => 0];
if ($result['database']['status'] === 'online') {
    try {
        $stats['products']   = (int) $db->query('SELECT COUNT(*) FROM Products')->fetchColumn();
        $stats['users']      = (int) $db->query('SELECT COUNT(*) FROM Users')->fetchColumn();
        $stats['orders']     = (int) $db->query('SELECT COUNT(*) FROM Orders')->fetchColumn();
        $stats['categories'] = (int) $db->query('SELECT COUNT(*) FROM Categories')->fetchColumn();
    } catch (Throwable $e) { /* counts stay 0 */ }
}
$result['stats'] = $stats;

// ── Endpoint file existence (quick sanity check) ───────────────────────────
$phpRoot = dirname(__DIR__); // php/
$filemap = [
    'auth/check'                 => 'auth/check.php',
    'auth/login'                 => 'auth/login.php',
    'auth/register'              => 'auth/register.php',
    'auth/logout'                => 'auth/logout.php',
    'listings/get-listings'      => 'listings/get-listings.php',
    'listings/get-product'       => 'listings/get-product.php',
    'listings/create'            => 'listings/create.php',
    'listings/delete'            => 'listings/delete.php',
    'cart/get'                   => 'cart/get.php',
    'cart/add'                   => 'cart/add.php',
    'cart/remove'                => 'cart/remove.php',
    'messages/get-conversations' => 'messages/get-conversations.php',
    'messages/get-thread'        => 'messages/get-thread.php',
    'messages/send'              => 'messages/send.php',
    'profile/get'                => 'profile/get.php',
    'orders/place-order'         => 'orders/place-order.php',
    'contact/send'               => 'contact/send.php',
    'admin/get-users'            => 'admin/get-users.php',
    'admin/get-listings'         => 'admin/get-listings.php',
    'admin/update-user'          => 'admin/update-user.php',
    'admin/update-listing'       => 'admin/update-listing.php',
    'admin/delete-listing'       => 'admin/delete-listing.php',
    'admin/toggle-admin'         => 'admin/toggle-admin.php',
    'admin/monitor'              => 'admin/monitor.php',
];

$fileStatus = [];
foreach ($filemap as $key => $rel) {
    $fileStatus[$key] = file_exists($phpRoot . '/' . $rel) ? 'present' : 'missing';
}
$result['file_checks'] = $fileStatus;

// ── Server info ────────────────────────────────────────────────────────────
$result['server'] = [
    'php_version'     => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'timestamp'       => gmdate('Y-m-d H:i:s') . ' UTC',
    'memory_usage'    => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
    'max_memory'      => ini_get('memory_limit'),
];

echo json_encode($result);
