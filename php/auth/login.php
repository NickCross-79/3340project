<?php
require_once '../config/db.php';
require_once '../config/session.php';

startSession();

// Redirect away if already logged in
if (isLoggedIn()) {
    header('Location: ../../index.html');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../html/login.html');
    exit;
}

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if ($email === '' || $password === '') {
    header('Location: ../../html/login.html?error=missing_fields');
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../../html/login.html?error=invalid_credentials');
    exit;
}

$db   = getDB();
$stmt = $db->prepare('SELECT user_id, username, password_hash FROM Users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Use password_verify() — plain-text seed passwords won't match until re-hashed via register
if (!$user || !password_verify($password, $user['password_hash'])) {
    header('Location: ../../html/login.html?error=invalid_credentials');
    exit;
}

// Regenerate session ID on login to prevent session fixation
session_regenerate_id(true);

$_SESSION['user_id']  = (int) $user['user_id'];
$_SESSION['username'] = $user['username'];

header('Location: ../../index.html');
exit;
