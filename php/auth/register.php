<?php
require_once '../config/db.php';
require_once '../config/session.php';

startSession();

if (isLoggedIn()) {
    header('Location: ../../index.html');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../html/register.html');
    exit;
}

$firstName = trim($_POST['firstName'] ?? '');
$lastName  = trim($_POST['lastName']  ?? '');
$email     = trim($_POST['email']     ?? '');
$password  = $_POST['password']        ?? '';
$confirm   = $_POST['confirmPassword'] ?? '';

// Field presence
if ($firstName === '' || $lastName === '' || $email === '' || $password === '' || $confirm === '') {
    header('Location: ../../html/register.html?error=missing_fields');
    exit;
}

// Email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../../html/register.html?error=invalid_email');
    exit;
}

// Password strength: minimum 8 chars
if (strlen($password) < 8) {
    header('Location: ../../html/register.html?error=weak_password');
    exit;
}

// Password match
if ($password !== $confirm) {
    header('Location: ../../html/register.html?error=password_mismatch');
    exit;
}

$username = $firstName . ' ' . $lastName;
$db       = getDB();

// Check for duplicate email
$stmt = $db->prepare('SELECT user_id FROM Users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    header('Location: ../../html/register.html?error=email_taken');
    exit;
}

// Check for duplicate username
$stmt = $db->prepare('SELECT user_id FROM Users WHERE username = ?');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    header('Location: ../../html/register.html?error=username_taken');
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $db->prepare('INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$username, $email, $hash]);

$userId = (int) $db->lastInsertId();

session_regenerate_id(true);
$_SESSION['user_id']  = $userId;
$_SESSION['username'] = $username;

header('Location: ../../index.html');
exit;
