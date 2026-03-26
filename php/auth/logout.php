<?php
require_once '../config/session.php';

startSession();
$_SESSION = [];
session_destroy();

header('Location: ../../index.html');
exit;
