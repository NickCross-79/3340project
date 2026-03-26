<?php
require_once '../config/session.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

startSession();

if (isLoggedIn()) {
    echo json_encode([
        'loggedIn' => true,
        'username' => currentUsername(),
        'userId'   => currentUserId(),
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
