/**
 * admin.js — Admin Dashboard logic for Lancer Loot
 * Loaded only on admin.html after scripts.js
 */

(function () {
    'use strict';

    const phpBase = '../php/';

    // ── All theme definitions (mirrors header dropdown) ──────────────────────
    const THEMES = [
        {
            file: 'default-theme.css',
            label: 'Default',
            bar: '#41337a',
            swatches: ['#fff', '#c2efeb', '#63ea4b'],
        },
        {
            file: 'theme3.css',
            label: 'Playful',
            bar: '#e07b39',
            swatches: ['#fff8f0', '#ffe0c0', '#e07b39'],
        },
        {
            file: 'winter-theme.css',
            label: 'Winter',
            bar: '#1a6fa8',
            swatches: ['#eaf4fb', '#b8d9f0', '#1a6fa8'],
        },
        {
            file: 'theme-blue-gold.css',
            label: 'Blue & Gold',
            bar: '#003087',
            swatches: ['#f0f4ff', '#ffd700', '#003087'],
        },
        {
            file: 'theme-earthy.css',
            label: 'Earthy',
            bar: '#5c3d2e',
            swatches: ['#fdf6ec', '#e8c99a', '#5c3d2e'],
        },
        {
            file: 'theme-green.css',
            label: 'Nature',
            bar: '#2d6a4f',
            swatches: ['#f0faf4', '#b7e4c7', '#2d6a4f'],
        },
    ];

    // ─────────────────────────────────────────────
    //  Boot: verify admin access
    // ─────────────────────────────────────────────
    function boot() {
        fetch(phpBase + 'auth/check.php')
            .then(r => r.json())
            .then(auth => {
                if (!auth.loggedIn || !auth.isAdmin) {
                    document.getElementById('admin-access-denied').style.display = 'block';
                    return;
                }
                document.getElementById('admin-dashboard').style.display = 'block';
                initSidebar();
                renderThemeCards();
                adminLoadListings();
                adminLoadUsers();
            })
            .catch(() => {
                document.getElementById('admin-access-denied').style.display = 'block';
            });
    }

    // ─────────────────────────────────────────────
    //  Sidebar navigation
    // ─────────────────────────────────────────────
    function initSidebar() {
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.admin-panel').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const panelId = 'panel-' + item.dataset.panel;
                const panel = document.getElementById(panelId);
                if (panel) {
                    panel.classList.add('active');
                    // Lazy-load panels on first open
                    if (!panel.dataset.loaded) {
                        if (item.dataset.panel === 'products') {
                            panel.dataset.loaded = '1';
                            adminLoadProducts();
                        }
                        if (item.dataset.panel === 'monitoring') {
                            panel.dataset.loaded = '1';
                            runMonitoring();
                        }
                    }
                }
            });
        });
    }

    // ─────────────────────────────────────────────
    //  Themes
    // ─────────────────────────────────────────────
    function renderThemeCards() {
        const grid    = document.getElementById('theme-grid');
        const current = localStorage.getItem('theme') || 'default-theme.css';

        grid.innerHTML = THEMES.map(t => {
            const isSelected = current === t.file;
            const swatchHtml = t.swatches.map(
                s => `<div class="theme-preview-swatch" style="background:${s}"></div>`
            ).join('');
            return `
            <div class="theme-card${isSelected ? ' selected' : ''}" 
                 data-file="${t.file}"
                 onclick="adminSetTheme('${t.file}', this)"
                 title="Apply ${t.label} theme">
                <div class="theme-preview">
                    <div class="theme-preview-bar" style="background:${t.bar}"></div>
                    <div class="theme-preview-body">${swatchHtml}</div>
                </div>
                <div class="theme-card-label">${t.label}</div>
            </div>`;
        }).join('');
    }

    window.adminSetTheme = function (file, el) {
        // Use the global setTheme() from scripts.js
        setTheme(file);

        // Update selected state on cards
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
        if (el) el.classList.add('selected');

        showToast('Theme changed to ' + file.replace('.css', '').replace(/-/g, ' '));
    };

    // ─────────────────────────────────────────────
    //  Listings
    // ─────────────────────────────────────────────
    let _allCategories = [];

    window.adminLoadListings = function () {
        const tbody  = document.getElementById('admin-listings-body');
        const q      = document.getElementById('listing-search').value.trim();
        const status = document.getElementById('listing-status-filter').value;

        tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);">Loading…</td></tr>';

        let url = phpBase + 'admin/get-listings.php?limit=50';
        if (q)      url += '&q='      + encodeURIComponent(q);
        if (status) url += '&status=' + encodeURIComponent(status);

        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (data.error) { tbody.innerHTML = `<tr><td colspan="7">${escHtml(data.error)}</td></tr>`; return; }

                _allCategories = data.categories || [];

                const count = document.getElementById('listings-count');
                if (count) count.textContent = `Showing ${data.listings.length} of ${data.total} listings`;

                if (!data.listings.length) {
                    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);">No listings found.</td></tr>';
                    return;
                }

                tbody.innerHTML = data.listings.map(l => `
                    <tr>
                        <td>${l.product_id}</td>
                        <td>${escHtml(l.title)}</td>
                        <td>${escHtml(l.seller)}</td>
                        <td>${escHtml(l.cat_name || '—')}</td>
                        <td>$${parseFloat(l.price).toFixed(2)}</td>
                        <td><span class="badge badge-${l.status.toLowerCase()}">${escHtml(l.status)}</span></td>
                        <td style="white-space:nowrap;">
                            <button class="btn-sm" onclick='adminOpenEditListing(${JSON.stringify(l)})'>Edit</button>
                            <button class="btn-sm btn-danger" onclick="adminDeleteListing(${l.product_id})">Delete</button>
                        </td>
                    </tr>`).join('');
            })
            .catch(() => {
                tbody.innerHTML = '<tr><td colspan="7">Could not load listings.</td></tr>';
            });
    };

    window.adminOpenEditListing = function (listing) {
        document.getElementById('edit-product-id').value  = listing.product_id;
        document.getElementById('edit-title').value        = listing.title;
        document.getElementById('edit-description').value  = listing.description || '';
        document.getElementById('edit-price').value        = parseFloat(listing.price).toFixed(2);
        document.getElementById('edit-status').value       = listing.status;
        document.getElementById('edit-condition').value    = listing.condition_status || 'New';

        // Populate category dropdown
        const catSel = document.getElementById('edit-cat-id');
        catSel.innerHTML = _allCategories.map(
            c => `<option value="${c.cat_id}"${c.cat_id == listing.cat_id ? ' selected' : ''}>${escHtml(c.cat_name)}</option>`
        ).join('');

        openModal('edit-listing-modal');
    };

    window.adminSaveListing = function () {
        const payload = {
            product_id:       parseInt(document.getElementById('edit-product-id').value),
            title:            document.getElementById('edit-title').value.trim(),
            description:      document.getElementById('edit-description').value.trim(),
            price:            parseFloat(document.getElementById('edit-price').value),
            status:           document.getElementById('edit-status').value,
            condition_status: document.getElementById('edit-condition').value,
            cat_id:           parseInt(document.getElementById('edit-cat-id').value),
        };

        fetch(phpBase + 'admin/update-listing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(r => r.json())
            .then(data => {
                if (data.error) { showToast(data.error, true); return; }
                closeModal('edit-listing-modal');
                showToast('Listing updated successfully');
                adminLoadListings();
            })
            .catch(() => showToast('Failed to save listing', true));
    };

    window.adminDeleteListing = function (productId) {
        if (!confirm('Permanently delete this listing? This cannot be undone.')) return;

        fetch(phpBase + 'admin/delete-listing.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.error) { showToast(data.error, true); return; }
                showToast('Listing deleted');
                adminLoadListings();
            })
            .catch(() => showToast('Failed to delete listing', true));
    };

    // ─────────────────────────────────────────────
    //  Users
    // ─────────────────────────────────────────────
    let _allUsers = [];

    window.adminLoadUsers = function () {
        const tbody = document.getElementById('admin-users-body');
        tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);">Loading…</td></tr>';

        fetch(phpBase + 'admin/get-users.php')
            .then(r => r.json())
            .then(data => {
                if (data.error) { tbody.innerHTML = `<tr><td colspan="7">${escHtml(data.error)}</td></tr>`; return; }
                _allUsers = data.users || [];
                renderUsersTable(_allUsers);
            })
            .catch(() => {
                document.getElementById('admin-users-body').innerHTML =
                    '<tr><td colspan="7">Could not load users.</td></tr>';
            });
    };

    function renderUsersTable(users) {
        const tbody = document.getElementById('admin-users-body');

        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);">No users found.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => {
            const disabled = parseInt(u.is_disabled) === 1;
            const admin    = parseInt(u.is_admin) === 1;
            const joined   = u.created_at ? u.created_at.substring(0, 10) : '—';

            const statusBadge = disabled
                ? '<span class="badge badge-disabled">Disabled</span>'
                : '<span class="badge badge-active">Active</span>';

            const roleBadge = admin
                ? '<span class="badge badge-admin">Admin</span>'
                : '<span class="badge" style="background:var(--line);color:var(--ink);">User</span>';

            const toggleDisableBtn = disabled
                ? `<button class="btn-sm btn-success" onclick="adminToggleDisable(${u.user_id}, false)">Enable</button>`
                : `<button class="btn-sm btn-danger"  onclick="adminToggleDisable(${u.user_id}, true)">Disable</button>`;

            const toggleAdminBtn = admin
                ? `<button class="btn-sm" onclick="adminToggleAdminRole(${u.user_id}, false)">Revoke Admin</button>`
                : `<button class="btn-sm btn-primary" onclick="adminToggleAdminRole(${u.user_id}, true)">Grant Admin</button>`;

            return `
            <tr>
                <td>${u.user_id}</td>
                <td>${escHtml(u.username)}</td>
                <td>${escHtml(u.email)}</td>
                <td>${joined}</td>
                <td>${statusBadge}</td>
                <td>${roleBadge}</td>
                <td style="white-space:nowrap;">${toggleDisableBtn} ${toggleAdminBtn}</td>
            </tr>`;
        }).join('');
    }

    window.adminFilterUsers = function () {
        const q = document.getElementById('user-search').value.toLowerCase();
        if (!q) { renderUsersTable(_allUsers); return; }
        renderUsersTable(_allUsers.filter(u =>
            u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        ));
    };

    window.adminToggleDisable = function (userId, disable) {
        const action = disable ? 'disable' : 're-enable';
        if (!confirm(`Are you sure you want to ${action} this account?`)) return;

        fetch(phpBase + 'admin/update-user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_disabled: disable ? 1 : 0 }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.error) { showToast(data.error, true); return; }
                showToast(`Account ${disable ? 'disabled' : 're-enabled'}`);
                adminLoadUsers();
            })
            .catch(() => showToast('Failed to update account', true));
    };

    window.adminToggleAdminRole = function (userId, grant) {
        const action = grant ? 'grant admin to' : 'revoke admin from';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        fetch(phpBase + 'admin/update-user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, is_admin: grant ? 1 : 0 }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.error) { showToast(data.error, true); return; }
                showToast(`Admin role ${grant ? 'granted' : 'revoked'}`);
                adminLoadUsers();
            })
            .catch(() => showToast('Failed to update role', true));
    };

    // ─────────────────────────────────────────────
    //  Products (read-only overview table)
    // ─────────────────────────────────────────────
    let _allProducts = [];

    window.adminLoadProducts = function () {
        const tbody = document.getElementById('admin-products-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);">Loading…</td></tr>';

        fetch(phpBase + 'admin/get-listings.php?limit=200')
            .then(r => r.json())
            .then(data => {
                if (data.error) { tbody.innerHTML = `<tr><td colspan="8">${escHtml(data.error)}</td></tr>`; return; }
                _allProducts = data.listings || [];
                renderProductsTable(_allProducts);
            })
            .catch(() => {
                const tb = document.getElementById('admin-products-body');
                if (tb) tb.innerHTML = '<tr><td colspan="8">Could not load products.</td></tr>';
            });
    };

    function renderProductsTable(products) {
        const tbody = document.getElementById('admin-products-body');
        const count = document.getElementById('products-count');
        if (!tbody) return;
        if (count) count.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
        if (!products.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);">No products match the filter.</td></tr>';
            return;
        }
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.product_id}</td>
                <td>${escHtml(p.title)}</td>
                <td>${escHtml(p.seller)}</td>
                <td>${escHtml(p.cat_name || '—')}</td>
                <td>$${parseFloat(p.price).toFixed(2)}</td>
                <td>${escHtml(p.condition_status || '—')}</td>
                <td><span class="badge badge-${p.status.toLowerCase()}">${escHtml(p.status)}</span></td>
                <td>${p.created_at ? p.created_at.substring(0, 10) : '—'}</td>
            </tr>`).join('');
    }

    window.adminFilterProducts = function () {
        const q      = (document.getElementById('products-search')?.value || '').toLowerCase();
        const status = document.getElementById('products-status-filter')?.value || '';
        let filtered = _allProducts;
        if (q)      filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.seller.toLowerCase().includes(q) ||
            (p.cat_name || '').toLowerCase().includes(q)
        );
        if (status) filtered = filtered.filter(p => p.status === status);
        renderProductsTable(filtered);
    };

    // ─────────────────────────────────────────────
    //  Monitoring
    // ─────────────────────────────────────────────
    const MONITOR_SERVICES = [
        { name: 'Authentication',     url: phpBase + 'auth/check.php' },
        { name: 'Listings',           url: phpBase + 'listings/get-listings.php?limit=1' },
        { name: 'Product Detail',     url: phpBase + 'listings/get-product.php?id=1' },
        { name: 'Cart',               url: phpBase + 'cart/get.php' },
        { name: 'Messages',           url: phpBase + 'messages/get-conversations.php' },
        { name: 'Profile',            url: phpBase + 'profile/get.php' },
        { name: 'Orders',             url: phpBase + 'orders/place-order.php' },
        { name: 'Contact',            url: phpBase + 'contact/send.php' },
        { name: 'Admin: Users',       url: phpBase + 'admin/get-users.php' },
        { name: 'Admin: Listings',    url: phpBase + 'admin/get-listings.php?limit=1' },
        { name: 'Admin: Monitor',     url: phpBase + 'admin/monitor.php' },
    ];

    async function pingService(url, timeoutMs) {
        timeoutMs = timeoutMs || 6000;
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        const t0    = performance.now();
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            const ms  = Math.round(performance.now() - t0);
            clearTimeout(timer);
            return { status: 'online', latency: ms, code: res.status };
        } catch (_) {
            clearTimeout(timer);
            return { status: 'offline', latency: null, code: null };
        }
    }

    window.runMonitoring = async function () {
        const grid        = document.getElementById('services-grid');
        const statsRow    = document.getElementById('stats-row');
        const serverGrid  = document.getElementById('server-info-grid');
        const summary     = document.getElementById('monitor-summary');
        const summaryTxt  = document.getElementById('monitor-summary-text');
        const lastChecked = document.getElementById('monitor-last-checked');
        if (!grid) return;

        // Reset UI to "checking" state
        if (summary) summary.className = 'monitor-summary checking';
        if (summaryTxt) summaryTxt.textContent = 'Checking services…';

        // Render placeholder cards
        grid.innerHTML = MONITOR_SERVICES.map(s => `
            <div class="service-card" id="svc-${s.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}">
                <div class="service-name">${escHtml(s.name)}</div>
                <div class="service-status-row">
                    <span class="status-dot checking"></span>
                    <span>Checking…</span>
                </div>
            </div>`).join('');

        // Fetch server-side data (DB stats, server info) and ping all services in parallel
        const [serverData, ...pingResults] = await Promise.all([
            fetch(phpBase + 'admin/monitor.php').then(r => r.json()).catch(() => null),
            ...MONITOR_SERVICES.map(s => pingService(s.url)),
        ]);

        // ── DB Statistics ──────────────────────────────
        if (statsRow) {
            if (serverData && serverData.stats) {
                const s = serverData.stats;
                statsRow.innerHTML = [
                    { label: 'Products',   value: s.products   },
                    { label: 'Users',      value: s.users      },
                    { label: 'Orders',     value: s.orders     },
                    { label: 'Categories', value: s.categories },
                ].map(item => `
                    <div class="stat-card">
                        <div class="stat-value">${item.value}</div>
                        <div class="stat-label">${item.label}</div>
                    </div>`).join('');
            } else {
                statsRow.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;">Could not fetch database stats.</p>';
            }
        }

        // ── Server Info ────────────────────────────────
        if (serverGrid) {
            if (serverData && serverData.server) {
                const sv   = serverData.server;
                const dbOk = serverData.database && serverData.database.status === 'online';
                const dbMs = serverData.database && serverData.database.latency_ms != null
                    ? ` (${serverData.database.latency_ms}ms)` : '';
                serverGrid.innerHTML = [
                    { label: 'PHP Version',   value: sv.php_version },
                    { label: 'Server',        value: sv.server_software },
                    { label: 'Memory Usage',  value: sv.memory_usage + ' / ' + sv.max_memory },
                    { label: 'Server Time',   value: sv.timestamp },
                    { label: 'Database',      value: (dbOk ? '✓ Connected' : '✗ Disconnected') + dbMs, highlight: dbOk ? '#27ae60' : '#c0392b' },
                ].map(item => `
                    <div class="server-info-item">
                        <div class="info-label">${escHtml(item.label)}</div>
                        <div class="info-value"${item.highlight ? ` style="color:${item.highlight}"` : ''}>${escHtml(String(item.value))}</div>
                    </div>`).join('');
            } else {
                serverGrid.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;">Could not reach monitor endpoint.</p>';
            }
        }

        // ── Service cards ──────────────────────────────
        let offlineCount = 0;
        MONITOR_SERVICES.forEach((svc, i) => {
            const res    = pingResults[i];
            const cardId = 'svc-' + svc.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            const card   = document.getElementById(cardId);
            if (!card) return;

            if (res.status === 'offline') offlineCount++;
            const latencyText = res.latency != null ? `${res.latency} ms` : 'No response';
            const codeText    = res.code    != null ? ` · HTTP ${res.code}` : '';
            card.innerHTML = `
                <div class="service-name">${escHtml(svc.name)}</div>
                <div class="service-status-row">
                    <span class="status-dot ${res.status}"></span>
                    <span>${res.status === 'online' ? 'Online' : 'Offline'}</span>
                </div>
                <div class="service-latency">${latencyText}${codeText}</div>`;
        });

        // ── Summary banner ─────────────────────────────
        if (summary && summaryTxt) {
            if (offlineCount === 0) {
                summary.className = 'monitor-summary all-online';
                summaryTxt.textContent = '✓ All Systems Operational';
            } else {
                summary.className = 'monitor-summary has-offline';
                summaryTxt.textContent = `⚠ ${offlineCount} service${offlineCount > 1 ? 's' : ''} offline or unreachable`;
            }
        }

        if (lastChecked) {
            lastChecked.textContent = 'Last checked: ' + new Date().toLocaleTimeString();
        }
    };

    // ─────────────────────────────────────────────
    //  Modal helpers
    // ─────────────────────────────────────────────
    window.openModal = function (id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('open');
    };
    window.closeModal = function (id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
    };

    // Close modal when clicking outside
    document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });

    // ─────────────────────────────────────────────
    //  Toast
    // ─────────────────────────────────────────────
    let _toastTimer = null;
    window.showToast = function (msg, isError = false) {
        const toast = document.getElementById('admin-toast');
        toast.textContent = msg;
        toast.classList.toggle('error', isError);
        toast.classList.add('show');
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // ─────────────────────────────────────────────
    //  HTML escaping (mirrors scripts.js)
    // ─────────────────────────────────────────────
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ─────────────────────────────────────────────
    //  Enter key triggers listing search
    // ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('listing-search');
        if (searchInput) {
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') adminLoadListings();
            });
        }
    });

    // ─────────────────────────────────────────────
    //  Init after header loads (checkAuth fires first via scripts.js)
    // ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', boot);
})();
