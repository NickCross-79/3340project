<?php
/**
 * Create Listing
 * --------------
 * Validates the new-listing form, maps human-readable form values to their
 * database ENUM equivalents, handles an optional image upload (MIME-validated
 * via finfo, stored with a random hex filename), resolves the category ID,
 * and inserts a new row into the Products table.
 *
 * Method : POST
 * Route  : /php/listings/create.php
 * Auth   : Required — redirects to login.html if not authenticated
 * Inputs : productName, price, category, description, condition,
 *          quantity, location, productImage (file; optional)
 * Redirects to index.html?success=listing_created on success.
 */
require_once '../config/db.php';
require_once '../config/session.php';

requireLogin('../../html/login.html');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../../html/add-item-to-sell.html');
    exit;
}

$title       = trim($_POST['productName']  ?? '');
$priceRaw    = $_POST['price']             ?? '';
$categoryKey = $_POST['category']          ?? '';
$description = trim($_POST['description']  ?? '');
$conditionRaw = $_POST['condition']        ?? '';
$quantity    = (int) ($_POST['quantity']   ?? 1);
$location    = trim($_POST['location']     ?? '');

// Required field check
if ($title === '' || $priceRaw === '' || $categoryKey === '' || $description === '' || $conditionRaw === '') {
    header('Location: ../../html/add-item-to-sell.html?error=missing_fields');
    exit;
}

$price = filter_var($priceRaw, FILTER_VALIDATE_FLOAT);
if ($price === false || $price < 0) {
    header('Location: ../../html/add-item-to-sell.html?error=invalid_price');
    exit;
}

// Map form value → DB cat_name
$categoryMap = [
    'bmm'         => 'Books, Movies & Music',
    'clothing'    => 'Clothing & Accessories',
    'electronics' => 'Electronics',
    'furniture'   => 'Furniture',
    'sports'      => 'Sports & Outdoors',
    'tools'       => 'Tools & Hardware',
    'toys'        => 'Toys & Hobbies',
    'vehicles'    => 'Vehicles',
    'videogames'  => 'Video Games',
    'misc'        => 'Miscellaneous',
];

if (!array_key_exists($categoryKey, $categoryMap)) {
    header('Location: ../../html/add-item-to-sell.html?error=invalid_category');
    exit;
}

// Map form value → DB ENUM
$conditionMap = [
    'new'       => 'New',
    'like-new'  => 'Like New',
    'good'      => 'Good',
    'fair'      => 'Fair',
    'for-parts' => 'For Parts',
];

if (!array_key_exists($conditionRaw, $conditionMap)) {
    header('Location: ../../html/add-item-to-sell.html?error=invalid_condition');
    exit;
}

$db = getDB();

// Resolve cat_id
$stmt = $db->prepare('SELECT cat_id FROM Categories WHERE cat_name = ?');
$stmt->execute([$categoryMap[$categoryKey]]);
$cat = $stmt->fetch();
if (!$cat) {
    header('Location: ../../html/add-item-to-sell.html?error=invalid_category');
    exit;
}

// Handle image upload
$imageUrl  = 'placeholder.jpg';
$uploadDir = __DIR__ . '/../../assets/uploads/';

if (!empty($_FILES['productImage']['name'][0])) {
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $file    = $_FILES['productImage'];
    $tmpPath = $file['tmp_name'][0];

    // Validate MIME type from file content, not extension
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($tmpPath);

    if (!in_array($mime, $allowed, true)) {
        header('Location: ../../html/add-item-to-sell.html?error=invalid_image');
        exit;
    }

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $extMap   = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $ext      = $extMap[$mime];
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;

    move_uploaded_file($tmpPath, $uploadDir . $filename);
    $imageUrl = 'assets/uploads/' . $filename;
}

$stmt = $db->prepare(
    'INSERT INTO Products (seller_id, cat_id, title, description, price, condition_status, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    currentUserId(),
    $cat['cat_id'],
    $title,
    $description,
    $price,
    $conditionMap[$conditionRaw],
    $imageUrl,
]);

header('Location: ../../index.html?success=listing_created');
exit;
