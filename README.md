# Lancer Loot

**COMP3340 — Web Development | University of Windsor**

Lancer Loot is a local marketplace web app built as our final group project for COMP3340. The idea was to make something like Facebook Marketplace or Kijiji but scoped to the University of Windsor community. Users can register an account, post items they want to sell, browse listings, add things to a cart, checkout, and message sellers directly.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup--installation)
- [Pages & Routes](#pages--routes)
- [PHP Endpoints](#php-endpoints)
- [Themes](#themes)
- [Admin Panel](#admin-panel)
- [Known Issues / Limitations](#known-issues--limitations)
- [Team](#team)

---

## Project Overview

The goal of this project was to build a full-stack web application from scratch using the technologies covered in class. We chose to build a student-to-student marketplace because it felt like something people would actually use. The app lets you:

- Sign up and log in with a hashed password
- Browse product listings posted by other users
- Search listings by keyword
- View a detailed product page and add items to your cart
- Checkout and place an order (with shipping + payment options)
- Message sellers directly about a listing
- Manage your own listings and view your order history from your profile
- Switch between 6 different colour themes

We also built a full admin dashboard as an extra feature, which lets admins manage users, listings, and monitor the site.

---

## Features

### Core Features
- **User Registration & Login** — accounts use bcrypt password hashing, session fixation protection via `session_regenerate_id()`, and disabled-account checking
- **Listings** — users can create, view, and delete their own product listings with image upload support (MIME-validated via PHP `finfo`)
- **Search** — keyword search on the home page filters the listings grid in real time
- **Cart** — add products to cart, view quantities + subtotals, remove items
- **Checkout** — fills in shipping info and payment method, places order via a DB transaction
- **Messaging** — buyer/seller direct messaging tied to a specific product listing
- **Profile Page** — shows account info, order history, and active listings with a delete option
- **Theme Switcher** — 6 colour themes stored in `localStorage` and applied via CSS custom properties

### Admin Features
- Toggle admin role for any user (demo purposes)
- View and manage all user accounts (disable, change role)
- View and manage all product listings (update status, delete)
- Site monitoring panel (checks DB health, file permissions, server info)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front-end | HTML5, CSS3 (custom properties), Vanilla JavaScript |
| Back-end | PHP 8+ |
| Database | MySQL (PDO with prepared statements) |
| Icons | Font Awesome 6.5 |
| Server | Apache (XAMPP / shared hosting) |

We deliberately didn't use any frameworks (no Laravel, no React, no Bootstrap) because the assignment required us to write everything ourselves.

---

## Project Structure

```
webdev/
├── index.html                  # Home page (listings grid + hero)
├── README.md
│
├── html/                       # All other pages
│   ├── about.html
│   ├── add-item-to-sell.html
│   ├── admin.html              # Admin dashboard (requires admin role)
│   ├── cart.html
│   ├── checkout.html
│   ├── contact.html
│   ├── header.html             # Shared header fragment (injected by JS)
│   ├── help.html
│   ├── login.html
│   ├── messages.html
│   ├── product.html
│   ├── profile.html
│   └── register.html
│
├── css/
│   ├── main.css                # Core layout styles
│   ├── form-and-help.css       # Shared form, header, and help styles
│   ├── default-theme.css       # Default theme (white + teal + purple)
│   ├── theme-blue-gold.css     # Blue & Gold (UWindsor inspired)
│   ├── theme-earthy.css        # Earthy (terracotta + cream)
│   ├── theme-green.css         # Nature (forest green)
│   ├── theme3.css              # Playful (orange + red)
│   └── winter-theme.css        # Winter (mint + slate blue)
│
├── js/
│   ├── scripts.js              # Shared front-end logic (all pages)
│   └── admin.js                # Admin dashboard logic (admin page only)
│
├── php/
│   ├── auth/
│   │   ├── check.php           # Returns current session state as JSON
│   │   ├── login.php           # Handles login form POST
│   │   ├── logout.php          # Destroys session and redirects
│   │   └── register.php        # Handles registration form POST
│   ├── cart/
│   │   ├── add.php             # Add product to cart (upsert)
│   │   ├── get.php             # Return cart items + totals as JSON
│   │   └── remove.php          # Remove a product from cart
│   ├── config/
│   │   ├── db.php              # PDO singleton (getDB())
│   │   └── session.php         # Session helpers (isLoggedIn, requireLogin, etc.)
│   ├── contact/
│   │   └── send.php            # Save contact form submission
│   ├── listings/
│   │   ├── create.php          # Create a new product listing
│   │   ├── delete.php          # Delete a seller's own listing
│   │   ├── get-listings.php    # Return paginated/filtered listings as JSON
│   │   └── get-product.php     # Return single product detail as JSON
│   ├── messages/
│   │   ├── get-conversations.php  # Return conversation list for current user
│   │   ├── get-thread.php         # Return messages for a specific thread
│   │   └── send.php               # Send a new message
│   ├── orders/
│   │   └── place-order.php     # Process checkout (runs in a DB transaction)
│   ├── profile/
│   │   └── get.php             # Return profile, orders, listings for current user
│   └── admin/
│       ├── get-listings.php    # Admin: all listings
│       ├── get-users.php       # Admin: all users
│       ├── update-listing.php  # Admin: update listing status
│       ├── update-user.php     # Admin: toggle disable / update role
│       ├── delete-listing.php  # Admin: delete any listing
│       ├── toggle-admin.php    # Toggle admin role for current user (demo)
│       └── monitor.php         # Site health check (DB, files, server)
│
├── assets/
│   ├── lancer-loot-logo.png
│   ├── placeholder.jpg
│   └── uploads/               # User-uploaded listing images (created at runtime)
│
└── sql/
    └── Comp3340_Database_Import.sql   # Full database schema + seed data
```

---

## Database Schema

The database is named `oreillyn_lancer_loot`. Here's a quick summary of each table:

### `Users`
Stores registered accounts. The `is_admin` flag (TINYINT) controls access to the admin dashboard. `is_disabled` lets admins lock an account. Passwords are stored as bcrypt hashes — never plain text.

| Column | Type | Notes |
|---|---|---|
| user_id | INT PK | Auto-increment |
| username | VARCHAR(50) | Unique, formed from first + last name |
| email | VARCHAR(100) | Unique |
| password_hash | VARCHAR(255) | bcrypt via `password_hash()` |
| bio | TEXT | Optional profile bio |
| phone | VARCHAR(20) | Optional |
| location | VARCHAR(100) | Optional |
| is_admin | TINYINT(1) | 0 = regular user, 1 = admin |
| is_disabled | TINYINT(1) | 1 = account locked |
| profile_pic | VARCHAR(255) | Defaults to `default_user.png` |
| created_at | TIMESTAMP | Auto-set on insert |

### `Categories`
Simple lookup table. `cat_icon` is a Font Awesome class used to render an icon next to the category name.

### `Products`
The main listings table. `status` is an ENUM: `Available`, `Sold`, or `Archived`. When a checkout completes, all purchased products are set to `Sold`. Deleting a seller cascades to their listings.

### `Cart_Items`
Composite primary key `(user_id, product_id)` — one row per product per user. The PHP add-to-cart endpoint uses `INSERT ... ON DUPLICATE KEY UPDATE` so adding the same product twice just increments quantity.

### `Orders`
One row per completed checkout. Captures a snapshot of the shipping address and payment method at the time of purchase.

### `Order_Items`
Line items within an order. `price_at_purchase` is stored as a snapshot so the order history stays accurate even if a product's price changes later.

### `Contact_Messages`
Public contact form submissions. Admins can view these in the admin dashboard.

### `Messages`
Direct buyer ↔ seller messages. Optionally linked to a `product_id`. `is_read` is set to 1 when the receiver opens the thread, used to show unread badges in the conversation list.

---

## Setup & Installation

### Requirements
- PHP 8.0 or higher
- MySQL 8.0 or higher
- A web server (Apache via XAMPP works fine for local development)

### Steps

1. **Clone / copy the project** into your web server's document root (e.g. `htdocs/webdev` in XAMPP).

2. **Import the database**

   Open phpMyAdmin (or the MySQL CLI), create a database called `oreillyn_lancer_loot`, then import the SQL file:

   ```sql
   SOURCE /path/to/webdev/sql/Comp3340_Database_Import.sql;
   ```

3. **Configure the database connection**

   Open `php/config/db.php` and update the constants if your credentials are different:

   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'oreillyn_lancer_loot');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

4. **Check the uploads folder**

   The app stores listing images in `assets/uploads/`. Make sure the web server has write permission to that directory. On Linux/macOS:

   ```bash
   chmod 755 assets/uploads
   ```

5. **Open the site**

   Navigate to `http://localhost/webdev/` in your browser. You should see the home page with the seed listings.

6. **Log in as admin**

   The seed data includes an admin account:
   - Email: `nregan@uwindsor.ca`
   - **Note:** The seed passwords are plain-text hashes and won't work with `password_verify()`. Register a new account through the UI and then use the **Become Admin** toggle on the profile page to grant yourself admin access.

---

## Pages & Routes

| Page | File | Description |
|---|---|---|
| Home | `index.html` | Hero search + recent listings grid |
| Browse / Search | `index.html` | Search form updates the listings grid |
| Product Detail | `html/product.html?id=<n>` | Full product info, add to cart, message seller |
| Cart | `html/cart.html` | Items, quantities, subtotal, checkout link |
| Checkout | `html/checkout.html` | Shipping + payment form |
| Login | `html/login.html` | Email/password sign-in |
| Register | `html/register.html` | New account form |
| Profile | `html/profile.html` | Account info, orders, listings, admin toggle |
| Messages | `html/messages.html` | Conversation list + message thread |
| Sell | `html/add-item-to-sell.html` | New listing form with image upload |
| About | `html/about.html` | Project info |
| Help / FAQ | `html/help.html` | FAQ accordion |
| Contact | `html/contact.html` | Contact form |
| Admin | `html/admin.html` | Admin dashboard (requires `is_admin = 1`) |

---

## PHP Endpoints

All endpoints live under `php/` and follow the same pattern: validate input → interact with DB via PDO prepared statements → return JSON or redirect.

### Auth

| Endpoint | Method | Description |
|---|---|---|
| `php/auth/check.php` | GET | Returns `{ loggedIn, username, userId, isAdmin }` |
| `php/auth/login.php` | POST | Validates credentials, writes session |
| `php/auth/logout.php` | GET | Clears session, redirects to home |
| `php/auth/register.php` | POST | Validates + creates new user |

### Listings

| Endpoint | Method | Description |
|---|---|---|
| `php/listings/get-listings.php` | GET | Returns paginated listings. Supports `?q=`, `?limit=`, `?category=` |
| `php/listings/get-product.php` | GET | Returns single product detail. Requires `?id=` |
| `php/listings/create.php` | POST | Creates a new listing (auth required) |
| `php/listings/delete.php` | POST | Deletes own listing (auth + ownership check) |

### Cart

| Endpoint | Method | Description |
|---|---|---|
| `php/cart/get.php` | GET | Returns cart items + subtotal/tax/total |
| `php/cart/add.php` | POST | Adds or increments a product in the cart |
| `php/cart/remove.php` | POST | Removes a product from the cart |

### Orders

| Endpoint | Method | Description |
|---|---|---|
| `php/orders/place-order.php` | POST | Runs checkout transaction (insert order, mark sold, clear cart) |

### Messages

| Endpoint | Method | Description |
|---|---|---|
| `php/messages/get-conversations.php` | GET | Returns conversation list with unread counts |
| `php/messages/get-thread.php` | GET | Returns all messages for a thread (`?with=`, `?product_id=`) |
| `php/messages/send.php` | POST | Sends a new message |

### Profile

| Endpoint | Method | Description |
|---|---|---|
| `php/profile/get.php` | GET | Returns account info + orders + listings |

---

## Themes

The site has 6 swappable colour themes. The active theme is stored in `localStorage` under the key `theme` and applied by swapping the `<link id="theme-style">` `href` attribute. All colours are driven by CSS custom properties so a single `:root` block is all that needs to change per theme.

| Theme Name | File | Description |
|---|---|---|
| Default | `default-theme.css` | White background, teal surface, deep purple brand |
| Blue & Gold | `theme-blue-gold.css` | Navy and gold (UWindsor colours) |
| Earthy | `theme-earthy.css` | Terracotta and cream tones |
| Nature | `theme-green.css` | Forest greens |
| Playful | `theme3.css` | High-contrast orange and red |
| Winter | `winter-theme.css` | Icy mint and slate blue |

To add a new theme, create a `.css` file that defines the same 9 custom properties and add an `<option>` for it in `html/header.html`.

---

## Admin Panel

The admin panel is accessible at `html/admin.html` and is only visible in the nav when the logged-in user has `is_admin = 1`.

The dashboard has 5 panels:

- **Themes** — switch the site theme from the admin view
- **Listings** — view all products, update status, delete any listing
- **Products** — filterable product table with category and status filters
- **Users** — view all accounts, disable/enable, toggle admin role
- **Monitoring** — checks DB connectivity, upload folder permissions, session config, and PHP server info

For demo purposes, any logged-in user can give themselves admin access via the "Become Admin" button on the profile page.

---

## Known Issues / Limitations

- **No email verification** — accounts are activated immediately on registration with no email confirmation step
- **Seed passwords won't work** — the seed data uses plain-text strings as `password_hash` values, not actual bcrypt hashes, so you can't log in with the seed accounts. Register a fresh account instead.
- **Image uploads** — only JPEG, PNG, WebP, and GIF are accepted. No size limit is currently enforced server-side.
- **No pagination UI** — the listings API supports `?limit=` but the front-end doesn't have next/prev buttons yet.
- **No real payment processing** — checkout is purely a form. No Stripe or PayPal integration.
- **Mobile layout** — the site is usable on mobile but wasn't the main focus. Some tables overflow on small screens.

---

## Team

This project was built by a group of COMP3340 students at the University of Windsor for the Winter 2026 term.

> Built with too much coffee and not enough sleep. ☕
