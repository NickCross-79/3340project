<?php
/**
 * Logout
 * ------
 * Destroys the current session and redirects the user to the home page.
 *
 * Method : GET or POST (direct link from header nav)
 * Route  : /php/auth/logout.php
 */
require_once '../config/session.php';

startSession();
$_SESSION = [];
session_destroy();

header('Location: ../../index.html');
exit;
