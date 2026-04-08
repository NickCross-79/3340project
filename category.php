<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lancer Loot | Categories</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; color: #333; }
        nav { background: #331e36; color: white; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
        nav .logo { font-size: 1.4rem; font-weight: bold; }
        nav a { color: white; text-decoration: none; margin-left: 16px; font-size: 0.95rem; }
        .section { padding: 32px 24px; max-width: 1100px; margin: 0 auto; }
        .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .cat-card { background: #c2efeb; border: 1px solid #eee; padding: 40px 20px; text-align: center; border-radius: 8px; text-decoration: none; color: #331e36; transition: 0.3s; }
        .cat-card:hover { background: #a8ded9; transform: translateY(-5px); }
        footer { background: #331e36; color: #aaa; text-align: center; padding: 20px; margin-top: 60px; }
    </style>
</head>
<body>
    <nav>
        <span class="logo">Lancer Loot</span>
        <div>
            <a href="index.html">Home</a>
            <a href="browse.php">Browse</a>
            <a href="login.html">Sign In</a>
        </div>
    </nav>
    <div class="section">
        <h1>Browse by Category</h1>
        <p>Select a category to filter listings.</p>
        <div class="cat-grid">
            <a href="browse.php?cat=1" class="cat-card"><h3>Electronics</h3></a>
            <a href="browse.php?cat=2" class="cat-card"><h3>Clothing</h3></a>
            <a href="browse.php?cat=3" class="cat-card"><h3>Furniture</h3></a>
            <a href="browse.php?cat=4" class="cat-card"><h3>Vehicles</h3></a>
            <a href="browse.php?cat=5" class="cat-card"><h3>Home & Garden</h3></a>
            <a href="browse.php?cat=6" class="cat-card"><h3>Other</h3></a>
        </div>
    </div>
    <footer>&copy; 2026 Lancer Loot</footer>
</body>
</html>