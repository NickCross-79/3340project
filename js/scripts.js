const isRoot = !document.location.pathname.includes('/html/');
const headerPath = isRoot ? "html/header.html" : "header.html";
const phpBase    = isRoot ? "php/" : "../php/";

// ---- Header load ----
fetch(headerPath)
    .then(response => response.text())
    .then(data => {
        if (isRoot) {
            data = data.replace(/="\.\.\/([^"]+)"/g, '="$1"');
            data = data.replace(/="(?!index\.html)([a-z0-9][a-z0-9_-]*\.html)"/g, '="html/$1"');
        }
        const headerContainer = document.getElementById("header-container");
        if (headerContainer) {
            headerContainer.innerHTML = data;
            // Inject Font Awesome once for all pages
            if (!document.querySelector('link[href*="font-awesome"]')) {
                const fa = document.createElement('link');
                fa.rel  = 'stylesheet';
                fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
                document.head.appendChild(fa);
            }
            applyTheme();
            checkAuth();
        }
    });

// ---- Theme ----
function setTheme(value) {
    // Extract just the filename and store it portably
    const file = value.split('/').pop();
    localStorage.setItem("theme", file);
    applyTheme();
}

function applyTheme() {
    const el = document.getElementById("theme-style");
    if (!el) return;
    const saved = localStorage.getItem("theme");
    if (!saved) return;
    const prefix = isRoot ? "css/" : "../css/";
    el.href = prefix + saved;

    // Sync dropdown selection
    const dropdown = document.querySelector(".theme-dropdown");
    if (dropdown) {
        Array.from(dropdown.options).forEach(opt => {
            if (opt.value.endsWith(saved)) opt.selected = true;
        });
    }
}

window.addEventListener("DOMContentLoaded", applyTheme);

// ---- Auth state ----
function checkAuth() {
    fetch(phpBase + "auth/check.php")
        .then(r => r.json())
        .then(data => {
            const loggedIn  = document.getElementById("auth-logged-in");
            const loggedOut = document.getElementById("auth-logged-out");
            const usernameEl = document.getElementById("header-username");
            if (!loggedIn || !loggedOut) return;

            const navSell = document.getElementById("nav-sell");
            if (data.loggedIn) {
                loggedIn.style.display  = "flex";
                loggedOut.style.display = "none";
                if (usernameEl) usernameEl.textContent = data.username;
                if (navSell) navSell.style.display = "inline";
            } else {
                loggedIn.style.display  = "none";
                loggedOut.style.display = "flex";
                if (navSell) navSell.style.display = "none";
            }
        })
        .catch(() => {
            // If the check fails (e.g. no PHP server), show login/register
            const loggedOut = document.getElementById("auth-logged-out");
            if (loggedOut) loggedOut.style.display = "flex";
        });
}

// ---- Listings (index page) ----
function loadListings(query) {
    const grid = document.getElementById("listings-grid");
    if (!grid) return;

    grid.innerHTML = '<p style="color:var(--muted)">Loading listings…</p>';

    const qs = query ? '&q=' + encodeURIComponent(query) : '';
    fetch(phpBase + "listings/get-listings.php?limit=8" + qs)
        .then(r => r.json())
        .then(data => {
            const products = data.products || [];
            if (products.length === 0) {
                grid.innerHTML = '<p style="color:var(--muted)">No listings found.</p>';
                return;
            }
            grid.innerHTML = products.map(p => {
                const imgPrefix = isRoot ? '' : '../';
                const imgSrc = p.image_url && p.image_url !== 'placeholder.jpg'
                    ? imgPrefix + p.image_url
                    : imgPrefix + 'assets/placeholder.jpg';
                const price  = parseFloat(p.price).toFixed(2);
                const href   = isRoot ? 'html/product.html?id=' + p.product_id : 'product.html?id=' + p.product_id;
                return `<div class="card">
                    <img src="${imgSrc}" alt="${escHtml(p.title)}">
                    <div class="card-body">
                        <h3>${escHtml(p.title)}</h3>
                        <div class="price">$${escHtml(price)}</div>
                        <div class="location">${escHtml(p.cat_name || '')}</div>
                        <a href="${href}" class="btn">View</a>
                    </div>
                </div>`;
            }).join('');
        })
        .catch(() => {
            grid.innerHTML = '<p style="color:var(--muted)">Could not load listings.</p>';
        });
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---- Cart page ----
function loadCart() {
    const tbody    = document.getElementById("cart-body");
    const summary  = document.getElementById("cart-summary");
    const emptyMsg = document.getElementById("cart-empty");
    if (!tbody) return;

    fetch(phpBase + "cart/get.php")
        .then(r => {
            if (r.status === 401) {
                tbody.innerHTML = '';
                if (emptyMsg) { emptyMsg.style.display = 'block'; emptyMsg.textContent = 'Please sign in to view your cart.'; }
                return null;
            }
            return r.json();
        })
        .then(data => {
            if (!data) return;
            if (!data.items || data.items.length === 0) {
                tbody.innerHTML = '';
                if (emptyMsg) emptyMsg.style.display = 'block';
                if (summary)  summary.style.display  = 'none';
                return;
            }
            if (emptyMsg) emptyMsg.style.display = 'none';
            if (summary)  summary.style.display  = 'block';

            tbody.innerHTML = data.items.map(item => {
                const sub = (parseFloat(item.price) * parseInt(item.quantity)).toFixed(2);
                return `<tr>
                    <td><strong>${escHtml(item.title)}</strong><br><small>${escHtml(item.condition_status)}</small></td>
                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>$${sub}</td>
                    <td>
                        <form method="post" action="${phpBase}cart/remove.php">
                            <input type="hidden" name="product_id" value="${parseInt(item.product_id)}">
                            <button type="submit">Remove</button>
                        </form>
                    </td>
                </tr>`;
            }).join('');

            document.getElementById("cart-subtotal").textContent = "$" + data.subtotal.toFixed(2);
            document.getElementById("cart-tax").textContent      = "$" + data.tax.toFixed(2);
            document.getElementById("cart-total").textContent    = "$" + data.total.toFixed(2);
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="5">Could not load cart.</td></tr>';
        });
}

// ---- Profile page ----
function loadProfile() {
    const section = document.getElementById("profile-section");
    if (!section) return;

    fetch(phpBase + "profile/get.php")
        .then(r => {
            if (r.status === 401) {
                section.innerHTML = '<p>Please <a href="login.html">sign in</a> to view your profile.</p>';
                return null;
            }
            return r.json();
        })
        .then(data => {
            if (!data || !data.user) return;
            const u = data.user;

            document.getElementById("profile-name").textContent     = u.username     || '—';
            document.getElementById("profile-email").textContent    = u.email        || '—';
            document.getElementById("profile-phone").textContent    = u.phone        || 'Not set';
            document.getElementById("profile-location").textContent = u.location     || 'Not set';
            document.getElementById("profile-bio").textContent      = u.bio          || '';

            // Orders table
            const ordersBody = document.getElementById("orders-body");
            if (ordersBody) {
                if (!data.orders || data.orders.length === 0) {
                    ordersBody.innerHTML = '<tr><td colspan="4">No orders yet.</td></tr>';
                } else {
                    ordersBody.innerHTML = data.orders.map(o =>
                        `<tr>
                            <td>#${o.order_id}</td>
                            <td>${escHtml(o.created_at ? o.created_at.substring(0, 10) : '')}</td>
                            <td>${escHtml(o.status)}</td>
                            <td>$${parseFloat(o.total_amount).toFixed(2)}</td>
                        </tr>`
                    ).join('');
                }
            }

            // Listings table
            const listingsBody = document.getElementById("my-listings-body");
            if (listingsBody) {
                if (!data.listings || data.listings.length === 0) {
                    listingsBody.innerHTML = '<tr><td colspan="4">No listings yet.</td></tr>';
                } else {
                    listingsBody.innerHTML = data.listings.map(l =>
                        `<tr>
                            <td>${escHtml(l.title)}</td>
                            <td>$${parseFloat(l.price).toFixed(2)}</td>
                            <td>${escHtml(l.status)}</td>
                            <td>
                                <form method="post" action="${phpBase}listings/delete.php" onsubmit="return confirm('Delete this listing?')">
                                    <input type="hidden" name="product_id" value="${parseInt(l.product_id)}">
                                    <button type="submit">Delete</button>
                                </form>
                            </td>
                        </tr>`
                    ).join('');
                }
            }
        })
        .catch(() => {
            section.innerHTML = '<p>Could not load profile data.</p>';
        });
}

// ---- Product page ----
function loadProduct() {
    const params  = new URLSearchParams(location.search);
    const id      = parseInt(params.get('id'));
    const section = document.querySelector('.section');
    if (!id) {
        if (section) section.innerHTML = '<p>No product specified. <a href="../index.html">Browse listings</a></p>';
        return;
    }

    fetch(phpBase + 'listings/get-product.php?id=' + id)
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                if (section) section.innerHTML = '<p>' + escHtml(data.error) + ' <a href="../index.html">Browse listings</a></p>';
                return;
            }
            const p         = data.product;
            const imgPrefix = isRoot ? '' : '../';

            const bc = document.getElementById('product-breadcrumb');
            if (bc) bc.innerHTML = `<a href="${isRoot ? 'index.html' : '../index.html'}">Home</a> / ${escHtml(p.cat_name || 'Listings')} / ${escHtml(p.title)}`;

            const imgEl = document.getElementById('product-image');
            if (imgEl && p.image_url && p.image_url !== 'placeholder.jpg') {
                const img     = document.createElement('img');
                img.src       = imgPrefix + p.image_url;
                img.alt       = p.title;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:var(--r);display:block;';
                imgEl.appendChild(img);
            }

            document.getElementById('product-title').textContent            = p.title;
            document.getElementById('product-price').textContent            = '$' + parseFloat(p.price).toFixed(2);
            document.getElementById('product-location').textContent         = p.seller_location || '';
            document.getElementById('product-description').textContent      = p.description;
            document.getElementById('product-condition').textContent        = 'Condition: ' + (p.condition_status || '—');
            document.getElementById('product-category').textContent         = 'Category: '   + (p.cat_name        || '—');
            document.getElementById('product-status').textContent           = 'Status: '     + (p.status          || '—');
            document.getElementById('product-posted').textContent           = 'Posted: '     + (p.created_at ? p.created_at.substring(0, 10) : '—');
            document.getElementById('product-description-card').textContent = p.description;
            document.getElementById('product-seller-name').textContent      = p.seller;
            document.getElementById('add-to-cart-product-id').value         = p.product_id;

            if (p.status !== 'Available') {
                const btn = document.getElementById('add-to-cart-btn');
                if (btn) { btn.disabled = true; btn.textContent = 'No Longer Available'; }
            }

            document.title = 'Lancer Loot | ' + p.title;
            loadSimilar(p.product_id, p.cat_name);
        })
        .catch(() => {
            if (section) section.innerHTML = '<p>Could not load product. <a href="../index.html">Browse listings</a></p>';
        });
}

function loadSimilar(excludeId, catName) {
    const grid = document.getElementById('similar-grid');
    if (!grid) return;
    const imgPrefix = isRoot ? '' : '../';
    fetch(phpBase + 'listings/get-listings.php?limit=4&category=' + encodeURIComponent(catName || ''))
        .then(r => r.json())
        .then(data => {
            const products = (data.products || []).filter(p => p.product_id != excludeId).slice(0, 3);
            if (products.length === 0) {
                grid.innerHTML = '<p style="color:var(--muted)">No similar listings.</p>';
                return;
            }
            grid.innerHTML = products.map(p => {
                const imgSrc = p.image_url && p.image_url !== 'placeholder.jpg'
                    ? imgPrefix + p.image_url
                    : imgPrefix + 'assets/placeholder.jpg';
                const href = isRoot ? 'html/product.html?id=' + p.product_id : 'product.html?id=' + p.product_id;
                return `<div class="card">
                    <img src="${imgSrc}" alt="${escHtml(p.title)}" class="card-img">
                    <div class="card-body">
                        <h3>${escHtml(p.title)}</h3>
                        <div class="price">$${parseFloat(p.price).toFixed(2)}</div>
                        <div class="dist">${escHtml(p.cat_name || '')}</div>
                        <a href="${href}" class="btn">View</a>
                    </div>
                </div>`;
            }).join('');
        })
        .catch(() => { grid.innerHTML = ''; });
}

// Auto-run page-specific loaders
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("listings-grid"))   loadListings();
    if (document.getElementById("cart-body"))       loadCart();
    if (document.getElementById("profile-section")) loadProfile();
    if (document.getElementById("product-title"))   loadProduct();
});