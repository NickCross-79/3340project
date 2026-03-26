<?php
// Database connection configuration
// Update these values to match your server environment
define('DB_HOST',    'localhost');
define('DB_NAME',    'oreillyn_lancer_loot');
define('DB_USER',    'oreillyn_lancer_loot');
define('DB_PASS',    'lancerloot');
define('DB_CHARSET', 'utf8');

/**
 * Returns a shared PDO instance (lazy-initialized singleton).
 * Exits with a 500 JSON error if the connection fails.
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn     = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        // Do not expose the real error message to the client
        header('Content-Type: application/json');
        exit(json_encode(['error' => 'Database connection failed. Check server configuration.']));
    }

    return $pdo;
}
