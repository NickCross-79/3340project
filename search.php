<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Lancer Loot | Search</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .section { padding: 32px 24px; max-width: 1100px; margin: 0 auto; }
        .search-bar-container { background: #f4f4f4; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .search-bar-container input { padding: 10px; width: 70%; border: 1px solid #ddd; border-radius: 4px; }
        .search-bar-container .btn { padding: 10px 20px; border: none; cursor: pointer; }
        /* Reuse your listing styles below */
        .listings { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .card { border: 1px solid #eee; border-radius: 8px; padding-bottom: 15px; }
        .card-img { height: 160px; background: #eee; }
        .price { color: #63ea4b; font-weight: bold; padding: 10px; }
    </style>
</head>
<body>

    <div class="section">
        <h1>Find What You Need</h1>
        
        <div class="search-bar-container">
            <form action="search.php" method="GET">
                <input type="text" name="query" placeholder="Type something (e.g. Bike, Laptop)...">
                <button type="submit" class="btn" style="background: #41337a; color: white;">Search</button>
            </form>
        </div>

        <p>Results will appear below...</p>

        <div class="listings">
            <div class="card">
                <div class="card-img"></div>
                <div class="card-body" style="padding:10px;">
                    <h3>Search Result Placeholder</h3>
                    <p>When the database is connected, your results will show up here.</p>
                    <div class="price">$0.00</div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>