CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    is_admin TINYINT(1) DEFAULT 0,
    profile_pic VARCHAR(255) DEFAULT 'default_user.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Categories (
    cat_id INT PRIMARY KEY AUTO_INCREMENT,
    cat_name VARCHAR(100) NOT NULL UNIQUE,
    cat_icon VARCHAR(50) DEFAULT 'fa-tag' 
);

CREATE TABLE Products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT,
    cat_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('Available', 'Sold', 'Archived') DEFAULT 'Available',
    condition_status ENUM('New', 'Like New', 'Good', 'Fair', 'For Parts'),
    image_url VARCHAR(255) DEFAULT 'placeholder.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (cat_id) REFERENCES Categories(cat_id) ON DELETE SET NULL
);

INSERT INTO Users (username, email, password_hash, bio, is_admin) VALUES 
('Nancy Regan', 'nregan@uwindsor.ca', 'AdminHash123', 'System Administrator.', 1),
('Bill Smith', 'bsmith@uwindsor.ca', 'BillHash123', 'Student selling textbooks and furniture.', 0),
('Kevin Jones', 'kjones@gmail.com', 'KevinHash123', 'Tech enthusiast and gamer.', 0),
('Sarah Morton', 'smorton@outlook.com', 'SarahHash123', 'Collector of vintage items.', 0);

INSERT INTO Categories (cat_name, cat_icon) VALUES 
('Books, Movies & Music', 'fa-book'), ('Clothing & Accessories', 'fa-shirt'), 
('Electronics', 'fa-laptop'), ('Furniture', 'fa-couch'), 
('Sports & Outdoors', 'fa-basketball'), ('Tools & Hardware', 'fa-hammer'), 
('Toys & Hobbies', 'fa-puzzle-piece'), ('Vehicles', 'fa-car'), 
('Video Games', 'fa-gamepad'), ('Miscellaneous', 'fa-box');

INSERT INTO Products (cat_id, seller_id, title, description, price, condition_status) VALUES
(1, 4, 'Interstellar Vinyl', 'Limited edition soundtrack, pristine audio quality.', 45.00, 'New'),
(1, 4, 'The Alchemist', 'Classic inspirational novel by Paulo Coelho.', 12.99, 'Good'),
(2, 4, 'Running Shoes', 'Lightweight breathable mesh for long distance.', 85.50, 'New'),
(2, 4, 'Winter Parka', 'Heavy duty down-fill for extreme cold.', 150.00, 'Like New'),
(3, 3, 'Gaming Laptop', 'High performance laptop with RGB keyboard.', 1200.00, 'Like New'),
(3, 3, 'Wireless Mouse', 'Ergonomic design with silent click buttons.', 41.50, 'New'),
(4, 2, 'Standing Desk', 'Electric height adjustment with memory presets.', 300.00, 'New'),
(4, 2, 'Bean Bag Chair', 'Comfortable memory foam filling, very soft.', 60.00, 'Good'),
(5, 1, 'Yoga Mat', 'Eco-friendly material with extra grip.', 29.99, 'New'),
(5, 1, 'Mountain Bike', 'Sturdy frame for trail riding and off-road.', 450.00, 'Good'),
(6, 1, 'Impact Driver', 'Compact power tool with high torque output.', 119.99, 'New'),
(6, 1, 'Tool Chest', 'Heavy duty storage with locking drawers.', 220.00, 'Fair'),
(7, 4, 'Drone 4K', 'GPS assisted flight with 4K camera stability.', 350.00, 'Like New'),
(7, 4, 'RC Drift Car', 'High speed remote control car for drifting.', 90.00, 'Good'),
(8, 1, 'Thule Roof Box', 'Aerodynamic storage for extra luggage space.', 500.00, 'Good'),
(8, 1, 'HID Headlight Kit', 'Bright white light conversion for most cars.', 70.00, 'New'),
(9, 3, 'Zelda: Tears of Kingdom', 'Epic open world adventure for Switch.', 70.00, 'New'),
(9, 3, 'Retro Arcade Stick', 'Sanwa buttons for authentic arcade feel.', 130.00, 'Like New'),
(10, 1, 'Acoustic Guitar', 'Great starter guitar with rich warm tone.', 180.00, 'Good'),
(10, 1, 'Solar Power Bank', 'Charges via sunlight, rugged and waterproof.', 35.75, 'New');

-- ----------------------------------------------------------------
-- Additional tables required by the PHP backend
-- ----------------------------------------------------------------

ALTER TABLE Users
    ADD COLUMN IF NOT EXISTS phone    VARCHAR(20)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS Cart_Items (
    user_id    INT NOT NULL,
    product_id INT NOT NULL,
    quantity   INT NOT NULL DEFAULT 1,
    added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id)    REFERENCES Users(user_id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Orders (
    order_id        INT PRIMARY KEY AUTO_INCREMENT,
    buyer_id        INT NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(100) NOT NULL,
    address         VARCHAR(255) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    postal_code     VARCHAR(20)  NOT NULL,
    delivery_method ENUM('Delivery', 'Pickup') NOT NULL,
    payment_method  ENUM('Credit Card', 'Debit Card', 'Cash on Pickup') NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL,
    status          ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Order_Items (
    item_id            INT PRIMARY KEY AUTO_INCREMENT,
    order_id           INT NOT NULL,
    product_id         INT,
    quantity           INT NOT NULL DEFAULT 1,
    price_at_purchase  DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES Orders(order_id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Contact_Messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    subject    VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
