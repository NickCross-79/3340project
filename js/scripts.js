/**
 * scripts.js
 * ----------
 * Shared front-end logic loaded on every page. Responsibilities:
 *   - Path-aware header injection (root vs /html/ subdirectory)
 *   - Theme persistence (localStorage + <link> swap)
 *   - Auth-state check and nav element gating
 *   - Listings grid (index page)
 *   - Cart display & remove actions
 *   - Profile page data rendering
 *   - Product detail + similar-listings grid
 *   - Messages two-column UI (conversations + thread)
 */

// Detect if the current page is at the project root or inside /html/.
// This determines whether asset paths need a leading directory prefix.
const isRoot = !document.location.pathname.includes('/html/');
const headerPath = isRoot ? "html/header.html" : "header.html";
const phpBase    = isRoot ? "php/" : "../php/";

// ---- Header load ----
// Fetch the shared header fragment, fix relative URLs for root-level pages
// (strip one ../ prefix from paths), then inject into #header-container.
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
// setTheme() is called by the <select> in header.html; it stores the bare
// CSS filename (no path) so that the same key works on both root and /html/.
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
// Fetches the current session state from PHP and shows/hides the logged-in
// vs logged-out header sections and the Sell / Admin nav links accordingly.
function checkAuth() {
    fetch(phpBase + "auth/check.php")
        .then(r => r.json())
        .then(data => {
            const loggedIn  = document.getElementById("auth-logged-in");
            const loggedOut = document.getElementById("auth-logged-out");
            const usernameEl = document.getElementById("header-username");
            if (!loggedIn || !loggedOut) return;

            const navSell  = document.getElementById("nav-sell");
            const navAdmin = document.getElementById("nav-admin");
            if (data.loggedIn) {
                loggedIn.style.display  = "flex";
                loggedOut.style.display = "none";
                if (usernameEl) usernameEl.textContent = data.username;
                if (navSell)  navSell.style.display  = "inline";
                if (navAdmin) navAdmin.style.display  = data.isAdmin ? "inline" : "none";
            } else {
                loggedIn.style.display  = "none";
                loggedOut.style.display = "flex";
                if (navSell)  navSell.style.display  = "none";
                if (navAdmin) navAdmin.style.display  = "none";
            }
        })
        .catch(() => {
            // If the check fails (e.g. no PHP server), show login/register
            const loggedOut = document.getElementById("auth-logged-out");
            if (loggedOut) loggedOut.style.display = "flex";
        });
}

// ---- Listings (index page) ----
// Replaces the #listings-grid contents with product cards fetched from the
// API. An optional search query is forwarded as the ?q= parameter.
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

// XSS-safe HTML escaper used before injecting any server-supplied strings
// into innerHTML.  All five HTML-unsafe characters are replaced.
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---- Cart page ----
// Fetches the current user's cart (401 = not logged in) and renders the
// item table plus the subtotal / tax / total summary block.
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
// Fetches account info, order history, and active listings from the PHP
// profile endpoint, then populates each section of the profile page.
// Also calls updateAdminToggleUI() to reflect the user's current admin state.
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

            // Admin toggle UI
            updateAdminToggleUI();
        })
        .catch(() => {
            section.innerHTML = '<p>Could not load profile data.</p>';
        });
}

// ---- Admin toggle (profile page) ----
// Re-checks auth on every call so the button label and colour stay in sync
// with the server-side is_admin value after a toggle.
function updateAdminToggleUI() {
    const btn     = document.getElementById("admin-toggle-btn");
    const link    = document.getElementById("admin-dashboard-link");
    const msg     = document.getElementById("admin-toggle-msg");
    if (!btn) return;

    fetch(phpBase + "auth/check.php")
        .then(r => r.json())
        .then(data => {
            if (!data.loggedIn) return;
            const isAdmin = !!data.isAdmin;
            btn.textContent = isAdmin ? "Revoke Admin Role" : "Become Admin";
            btn.style.background = isAdmin ? "#c0392b" : "var(--brand-deep)";
            if (link) link.style.display = isAdmin ? "inline" : "none";
            if (msg)  msg.textContent    = isAdmin
                ? "You currently have admin privileges."
                : "Click to gain admin access for this demo session.";
        });
}

function toggleAdminRole() {
    const btn = document.getElementById("admin-toggle-btn");
    if (btn) { btn.disabled = true; btn.textContent = "Updating…"; }

    fetch(phpBase + "admin/toggle-admin.php", { method: "POST" })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert("Error: " + data.error);
            } else {
                updateAdminToggleUI();
                // Also refresh header admin link
                checkAuth();
            }
        })
        .catch(() => alert("Could not update admin status."))
        .finally(() => { if (btn) btn.disabled = false; });
}

// ---- Product page ----
// Reads ?id= from the query string and fetches full product detail.
// Also conditionally shows the "Message Seller" button if the viewer
// is logged in and is not the seller of the listing.
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

            // Message Seller button (only shown when logged in and not own listing)
            const msgBtn = document.getElementById('msg-seller-btn');
            if (msgBtn && p.seller_id) {
                fetch(phpBase + 'auth/check.php')
                    .then(r => r.json())
                    .then(auth => {
                        if (auth.loggedIn && auth.userId !== p.seller_id) {
                            const msgBase = isRoot ? 'html/messages.html' : 'messages.html';
                            msgBtn.href = msgBase
                                + '?with=' + p.seller_id
                                + '&product_id=' + p.product_id
                                + '&seller=' + encodeURIComponent(p.seller)
                                + '&title=' + encodeURIComponent(p.title);
                            msgBtn.style.display = 'inline-block';
                        }
                    });
            }

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
    if (document.getElementById("messages-layout")) loadMessages();
});

// ---- Messages page ----
// Checks auth before rendering the two-column layout, then loads the
// conversation list and automatically opens any thread specified by ?with=.

// State for the currently open thread
let _msgState = { receiverId: null, productId: null };

function loadMessages() {
    const layout   = document.getElementById("messages-layout");
    const authGuard = document.getElementById("messages-auth-guard");

    // Check auth first
    fetch(phpBase + "auth/check.php")
        .then(r => r.json())
        .then(auth => {
            if (!auth.loggedIn) {
                if (layout)    layout.style.display   = "none";
                if (authGuard) authGuard.style.display = "block";
                return;
            }
            // Load conversation list
            _loadConversations();

            // If URL has ?with= open that thread automatically
            const params = new URLSearchParams(location.search);
            const withId = parseInt(params.get("with"));
            const prodId = parseInt(params.get("product_id")) || null;
            if (withId > 0) {
                _openThread(withId, prodId, params.get("seller") || null, params.get("title") || null);
            }
        });
}

function _loadConversations() {
    const convItems = document.getElementById("conv-items");
    if (!convItems) return;
    convItems.innerHTML = '<p style="padding:16px;color:var(--muted);font-size:0.9rem;">Loading…</p>';

    fetch(phpBase + "messages/get-conversations.php")
        .then(r => {
            if (r.status === 401) return null;
            return r.json();
        })
        .then(data => {
            if (!data) {
                convItems.innerHTML = '<p style="padding:16px;color:var(--muted);font-size:0.9rem;">Sign in to view messages.</p>';
                return;
            }
            const convos = data.conversations || [];
            if (convos.length === 0) {
                convItems.innerHTML = '<p style="padding:16px;color:var(--muted);font-size:0.9rem;">No conversations yet.</p>';
                return;
            }
            convItems.innerHTML = convos.map(c => {
                const unreadBadge = c.unread > 0
                    ? `<span class="conv-unread">${parseInt(c.unread)}</span>`
                    : '';
                const sub = c.product_title
                    ? escHtml(c.product_title)
                    : (c.last_body ? escHtml(c.last_body.substring(0, 40)) : '');
                return `<div class="conv-item"
                             data-uid="${parseInt(c.other_id)}"
                             data-pid="${c.product_id ? parseInt(c.product_id) : ''}"
                             data-name="${escHtml(c.other_username)}"
                             data-title="${escHtml(c.product_title || '')}"
                             onclick="handleConvClick(this)">
                    ${unreadBadge}
                    <div class="conv-name">${escHtml(c.other_username)}</div>
                    <div class="conv-sub">${sub}</div>
                </div>`;
            }).join('');
        })
        .catch(() => {
            convItems.innerHTML = '<p style="padding:16px;color:var(--muted);font-size:0.9rem;">Could not load conversations.</p>';
        });
}

function handleConvClick(el) {
    document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    const uid   = parseInt(el.dataset.uid);
    const pid   = el.dataset.pid ? parseInt(el.dataset.pid) : null;
    const name  = el.dataset.name;
    const title = el.dataset.title || null;
    _openThread(uid, pid, name, title);
}

function _openThread(receiverId, productId, name, productTitle) {
    _msgState.receiverId = receiverId;
    _msgState.productId  = productId || null;

    const threadEmpty   = document.getElementById("thread-empty");
    const threadHeader  = document.getElementById("thread-header");
    const threadTitle   = document.getElementById("thread-title");
    const threadBadge   = document.getElementById("thread-product-label");
    const threadMsgs    = document.getElementById("thread-messages");
    const threadCompose = document.getElementById("thread-compose");

    if (threadEmpty)   threadEmpty.style.display   = "none";
    if (threadHeader)  threadHeader.style.display  = "flex";
    if (threadMsgs)    threadMsgs.style.display    = "flex";
    if (threadCompose) threadCompose.style.display = "flex";

    if (threadTitle) threadTitle.textContent = name || ("User " + receiverId);

    if (threadBadge) {
        if (productTitle) {
            threadBadge.textContent    = productTitle;
            threadBadge.style.display  = "inline";
        } else {
            threadBadge.style.display  = "none";
        }
    }

    if (threadMsgs) threadMsgs.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;">Loading…</p>';

    const qs = "?with=" + receiverId + (productId ? "&product_id=" + productId : "");
    fetch(phpBase + "messages/get-thread.php" + qs)
        .then(r => {
            if (r.status === 401) return null;
            return r.json();
        })
        .then(data => {
            if (!data || !threadMsgs) return;

            // Refresh conversation list to clear unread badges
            _loadConversations();

            // Resolve current user id from auth (cached in DOM if available)
            fetch(phpBase + "auth/check.php")
                .then(r => r.json())
                .then(auth => {
                    const myId = auth.userId;
                    const msgs = data.messages || [];

                    if (msgs.length === 0) {
                        threadMsgs.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;text-align:center;">No messages yet. Say hello!</p>';
                        return;
                    }

                    threadMsgs.innerHTML = msgs.map(m => {
                        const mine = m.sender_id == myId;
                        const ts   = m.sent_at ? m.sent_at.substring(0, 16).replace('T', ' ') : '';
                        return `<div class="msg-bubble ${mine ? 'mine' : 'theirs'}">
                            ${escHtml(m.body)}
                            <span class="msg-meta">${mine ? 'You' : escHtml(m.sender_name)} &bull; ${ts}</span>
                        </div>`;
                    }).join('');

                    // Scroll to bottom
                    threadMsgs.scrollTop = threadMsgs.scrollHeight;
                });
        })
        .catch(() => {
            if (threadMsgs) threadMsgs.innerHTML = '<p style="color:var(--muted);">Could not load messages.</p>';
        });

    // Wire up the compose form (remove old listener first)
    const composeForm = document.getElementById("thread-compose");
    if (composeForm) {
        const newForm = composeForm.cloneNode(true);
        composeForm.parentNode.replaceChild(newForm, composeForm);
        newForm.style.display = "flex";
        newForm.addEventListener("submit", _handleSend);
    }
}

function _handleSend(e) {
    e.preventDefault();
    const bodyEl = document.getElementById("compose-body");
    const body   = bodyEl ? bodyEl.value.trim() : "";
    if (!body) return;

    const form = new FormData();
    form.append("receiver_id", _msgState.receiverId);
    form.append("body", body);
    if (_msgState.productId) form.append("product_id", _msgState.productId);

    fetch(phpBase + "messages/send.php", { method: "POST", body: form })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                if (bodyEl) bodyEl.value = "";
                // Reload thread
                _openThread(_msgState.receiverId, _msgState.productId,
                    document.getElementById("thread-title")?.textContent,
                    document.getElementById("thread-product-label")?.textContent || null);
            } else {
                alert(data.error || "Could not send message.");
            }
        })
        .catch(() => alert("Could not send message."));
}