(function () {
    'use strict';

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    function showToast(message, type) {
        type = type || 'success';
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }

    function debounce(fn, delay) {
        var timer;
        return function () {
            var args = arguments;
            var ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
        };
    }

    var categoryIcons = {
        audio: '\uD83C\uDFA7',
        wearables: '\u231A',
        peripherals: '\u2328\uFE0F',
        accessories: '\uD83D\uDD0C',
        storage: '\uD83D\uDCBE'
    };

    function setProductIcons() {
        document.querySelectorAll('.product-image').forEach(function (el) {
            var cat = el.getAttribute('data-category');
            var icon = el.querySelector('.product-image-icon');
            if (icon) {
                icon.textContent = categoryIcons[cat] || '\uD83D\uDCE6';
            }
        });
        document.querySelectorAll('.product-detail-image').forEach(function (el) {
            var cat = el.getAttribute('data-category');
            var icon = el.querySelector('.product-image-icon-lg');
            if (icon) {
                icon.textContent = categoryIcons[cat] || '\uD83D\uDCE6';
                icon.style.fontSize = '6rem';
            }
        });
    }

    var currentCategory = 'all';

    function addToCart(productId, quantity) {
        quantity = parseInt(quantity) || 1;
        if (quantity > 40) quantity = 40;
        if (quantity < 1) quantity = 1;

        fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: productId, quantity: quantity })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.success) {
                showToast('Added to cart!', 'success');
                loadCart();
            } else {
                showToast(data.message || 'Failed to add to cart', 'error');
            }
        })
        .catch(function () {
            showToast('Network error. Please try again.', 'error');
        });
    }

    function removeFromCart(productId) {
        fetch('/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: productId })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.success) {
                showToast('Removed from cart', 'success');
                loadCart();
            } else {
                showToast(data.message || 'Failed to remove item', 'error');
            }
        })
        .catch(function () {
            showToast('Network error. Please try again.', 'error');
        });
    }

    function loadCart() {
        fetch('/cart')
        .then(function (r) { return r.json(); })
        .then(function (data) { updateCartUI(data); })
        .catch(function () {});
    }

    function updateCartUI(cart) {
        var badge = document.getElementById('cartBadge');
        if (badge) {
            var totalItems = 0;
            if (cart && cart.items) {
                cart.items.forEach(function (item) { totalItems += item.quantity; });
            }
            badge.textContent = totalItems;
        }

        var itemsContainer = document.getElementById('cartItems');
        var footer = document.getElementById('cartFooter');
        var totalEl = document.getElementById('cartTotal');
        if (!itemsContainer) return;

        if (!cart || !cart.items || cart.items.length === 0) {
            itemsContainer.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
            if (footer) footer.style.display = 'none';
            return;
        }

        var html = '';
        cart.items.forEach(function (item) {
            html += '<div class="cart-item">';
            html += '  <div class="cart-item-info">';
            html += '    <div class="cart-item-name">' + escapeHtml(item.name) + '</div>';
            html += '    <div class="cart-item-detail">Qty: ' + item.quantity + ' &times; $' + item.price.toFixed(2) + '</div>';
            html += '  </div>';
            html += '  <span class="cart-item-price">$' + (item.price * item.quantity).toFixed(2) + '</span>';
            html += '  <button class="cart-item-remove" onclick="removeFromCart(\'' + item.productId + '\')" title="Remove">&times;</button>';
            html += '</div>';
        });

        itemsContainer.innerHTML = html;
        if (footer) footer.style.display = 'block';
        if (totalEl) totalEl.textContent = '$' + cart.total.toFixed(2);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function initCartSidebar() {
        var toggle = document.getElementById('cartToggle');
        var sidebar = document.getElementById('cartSidebar');
        var overlay = document.getElementById('cartOverlay');
        var closeBtn = document.getElementById('cartClose');

        if (!toggle || !sidebar) return;

        function openCart() {
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            loadCart();
        }

        function closeCart() {
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }

        toggle.addEventListener('click', openCart);
        if (closeBtn) closeBtn.addEventListener('click', closeCart);
        if (overlay) overlay.addEventListener('click', closeCart);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeCart();
            }
        });
    }

    function buildSearchUrl(query) {
        var sid = getCookie('_em_cart') || 'anon_' + Math.random().toString(36).substr(2, 9);
        var t = Date.now();
        var sig = btoa(query + t).substr(0, 12);
        var uid = getCookie('_em_fpid') || 'guest';
        return '/shop/search?q=' + encodeURIComponent(query)
            + '&category=' + currentCategory
            + '&sort=relevance&order=desc&page=1&limit=24&currency=USD&locale=en-US&ref=nav_search'
            + '&sid=' + sid
            + '&t=' + t
            + '&sig=' + sig
            + '&v=2.1.3&include_oos=false&warehouse=US-EAST-1&price_min=0&price_max=99999'
            + '&brand_filter=all&rating_min=0&display=grid&ab_test=ctrl_group_b'
            + '&client_id=web_' + uid
            + '&_cache=' + Math.random().toString(36).substr(2, 5);
    }

    function performSearch(query) {
        var url = buildSearchUrl(query);
        fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) { renderProducts(data.products || []); })
        .catch(function () {});
    }

    function renderProducts(products) {
        var grid = document.getElementById('productGrid');
        if (!grid) return;

        if (products.length === 0) {
            grid.innerHTML = '<div class="no-products"><p>No products found.</p></div>';
            return;
        }

        var html = '';
        products.forEach(function (p) {
            var icon = categoryIcons[p.category] || '\uD83D\uDCE6';
            html += '<div class="product-card" data-category="' + escapeHtml(p.category) + '">';
            html += '  <a href="/shop/product/' + p.id + '" class="product-link">';
            html += '    <div class="product-image" data-category="' + escapeHtml(p.category) + '">';
            html += '      <span class="product-image-icon">' + icon + '</span>';
            html += '    </div>';
            html += '    <div class="product-info">';
            html += '      <span class="product-category">' + escapeHtml(p.category) + '</span>';
            html += '      <h3 class="product-name">' + escapeHtml(p.name) + '</h3>';
            html += '      <p class="product-price">$' + p.price.toFixed(2) + '</p>';
            html += '    </div>';
            html += '  </a>';
            html += '  <button class="btn btn-primary btn-add-cart" onclick="addToCart(\'' + p.id + '\', 1); event.preventDefault();">';
            html += '    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
            html += '    Add to Cart';
            html += '  </button>';
            html += '</div>';
        });

        grid.innerHTML = html;
    }

    function initSearch() {
        var searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        var debouncedSearch = debounce(function (e) {
            var query = e.target.value.trim();
            if (query.length > 0) {
                performSearch(query);
            } else if (query.length === 0) {
                performSearch('');
            }
        }, 350);

        searchInput.addEventListener('input', debouncedSearch);
    }

    function initCategoryFilters() {
        var buttons = document.querySelectorAll('.category-btn');
        if (!buttons.length) return;

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                buttons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-category');

                var cards = document.querySelectorAll('.product-card');
                cards.forEach(function (card) {
                    var cardCat = card.getAttribute('data-category');
                    if (currentCategory === 'all' || cardCat === currentCategory) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    function initRichEditor() {
        var editor = document.getElementById('bioEditor');
        var hiddenInput = document.getElementById('bioHidden');
        var form = document.getElementById('profileForm');
        var toolbarButtons = document.querySelectorAll('.toolbar-btn');

        if (!editor || !hiddenInput || !form) return;

        toolbarButtons.forEach(function (btn) {
            btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var command = btn.getAttribute('data-command');
                if (!command) return;

                if (command === 'createLink') {
                    var url = prompt('Enter URL:', 'https://');
                    if (url) document.execCommand('createLink', false, url);
                } else {
                    document.execCommand(command, false, null);
                }

                updateToolbarState();
                editor.focus();
            });
        });

        editor.addEventListener('keyup', updateToolbarState);
        editor.addEventListener('mouseup', updateToolbarState);

        function updateToolbarState() {
            toolbarButtons.forEach(function (btn) {
                var command = btn.getAttribute('data-command');
                if (command && command !== 'createLink') {
                    if (document.queryCommandState(command)) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                }
            });
        }

        form.addEventListener('submit', function () {
            hiddenInput.value = editor.innerHTML;
        });
    }

    function initAvatarUpload() {
        var input = document.getElementById('avatarInput');
        var fileName = document.getElementById('fileName');
        var preview = document.getElementById('avatarPreview');

        if (!input) return;

        input.addEventListener('change', function () {
            if (input.files && input.files[0]) {
                var file = input.files[0];
                if (fileName) fileName.textContent = file.name;

                if (file.type.startsWith('image/')) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        if (preview) {
                            if (preview.tagName === 'IMG') {
                                preview.src = e.target.result;
                            } else {
                                var img = document.createElement('img');
                                img.src = e.target.result;
                                img.alt = 'Avatar';
                                img.className = 'avatar-preview';
                                img.id = 'avatarPreview';
                                preview.parentNode.replaceChild(img, preview);
                            }
                        }
                    };
                    reader.readAsDataURL(file);
                }
            } else {
                if (fileName) fileName.textContent = 'No file chosen';
            }
        });
    }

    function initFlashDismiss() {
        var flash = document.getElementById('flashMessage');
        if (!flash) return;

        setTimeout(function () {
            flash.classList.add('fade-out');
            setTimeout(function () { flash.remove(); }, 500);
        }, 5000);
    }

    function initMobileMenu() {
        var btn = document.getElementById('mobileMenuBtn');
        var links = document.querySelector('.nav-links');
        if (!btn || !links) return;

        btn.addEventListener('click', function () {
            links.classList.toggle('active');
        });
    }

    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;

    document.addEventListener('DOMContentLoaded', function () {
        setProductIcons();
        initCartSidebar();
        initSearch();
        initCategoryFilters();
        initRichEditor();
        initAvatarUpload();
        initFlashDismiss();
        initMobileMenu();

        if (document.getElementById('cartBadge')) {
            loadCart();
        }
    });

})();
