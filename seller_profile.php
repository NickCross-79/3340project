<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Lancer Loot | Seller Profile</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; color: #333; }
        nav { background: #331e36; color: white; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
        .section { padding: 32px 24px; max-width: 1100px; margin: 0 auto; }
        .profile-header { background: #f9f9f9; padding: 40px; border-radius: 8px; text-align: center; margin-bottom: 40px; border: 1px solid #eee; }
        .profile-pic { width: 100px; height: 100px; background: #ddd; border-radius: 50%; margin: 0 auto 15px; }
        .listings { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .card { border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
        .card-img { height: 160px; background: #f4f4f4; }
        .price { color: #63ea4b; font-weight: bold; padding: 10px; }
        footer { background: #331e36; color: #aaa; text-align: center; padding: 20px; margin-top: 60px; }
    </style>
</head>
<body>
    <nav>
        <span style="font-weight:bold; font-size:1.4rem;">Lancer Loot</span>
        <div><a href="index.html">Home</a><a href="browse.php">Browse</a></div>
    </nav>
    <div class="section">
        <div class="profile-header">
            <div class="profile-pic"></div>
            <h1>Jordan M.</h1>
            <p>This is the user bio from the database.</p>
        </div>
        <h2>Active Listings</h2>
        <div class="listings">
            <div class="card">
                <div class="card-img"></div>
                <div style="padding:10px;">
                    <h3>Seller Item</h3>
                    <div class="price">$0.00</div>
                    <a href="product.html" style="color:#41337a; text-decoration:none;">View Details</a>
                </div>
            </div>
        </div>
    </div>
    <footer>&copy; 2026 Lancer Loot</footer>
</body>
</html>