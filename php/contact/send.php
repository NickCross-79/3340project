<?php
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../html/contact.html');
    exit;
}

$name    = mb_substr(trim($_POST['name']    ?? ''), 0, 100);
$email   = mb_substr(trim($_POST['email']   ?? ''), 0, 100);
$subject = mb_substr(trim($_POST['subject'] ?? ''), 0, 255);
$message = mb_substr(trim($_POST['message'] ?? ''), 0, 2000);

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    header('Location: ../../html/contact.html?error=missing_fields');
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../../html/contact.html?error=invalid_email');
    exit;
}

$db   = getDB();
$stmt = $db->prepare(
    'INSERT INTO Contact_Messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$name, $email, $subject, $message]);

header('Location: ../../html/contact.html?success=message_sent');
exit;
