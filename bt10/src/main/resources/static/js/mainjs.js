$(document).ready(function () {
    const token = localStorage.getItem('token');

    function showMessage(message, type) {
        if (!$('#message-box').length) return;
        $('#message-box').html(
            '<div class="alert alert-' + (type || 'info') + ' alert-dismissible fade show" role="alert">' +
            message +
            '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
            '</div>'
        );
    }

    function redirectToLogin() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }

    function authHeader(xhr) {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + currentToken);
        }
    }

    function decodeBase64Url(value) {
        let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    function decodeJwt(jwt) {
        if (!jwt) return null;
        const parts = jwt.split('.');
        if (parts.length !== 3) return null;
        try {
            return {
                header: JSON.parse(decodeBase64Url(parts[0])),
                payload: JSON.parse(decodeBase64Url(parts[1]))
            };
        } catch (e) {
            return null;
        }
    }

    function formatDate(value) {
        if (!value) return '-';
        try {
            return new Date(value).toLocaleString();
        } catch (e) {
            return value;
        }
    }

    function loadProfile() {
        $.ajax({
            type: 'GET',
            url: '/users/me',
            dataType: 'json',
            beforeSend: authHeader,
            success: function (data) {
                $('#auth-status').text('Đã xác thực');
                $('#profile').text(data.fullName || 'User');
                $('#profile-email').text(data.email || '');
                $('#nav-user').text(data.fullName || data.email || 'User');

                const imageName = data.images || 'user.svg';
                const imageUrl = imageName.startsWith('/') ? imageName : '/images/' + imageName;
                $('#images').html('<img src="' + imageUrl + '" alt="User image" class="user-avatar">');

                $('#me-id').text(data.id ?? '-');
                $('#me-fullname').text(data.fullName || '-');
                $('#me-email').text(data.email || '-');
                $('#me-role').text(data.role || '-');
                $('#me-image').text(data.images || '-');
                $('#me-created').text(formatDate(data.createdAt));
                $('#me-updated').text(formatDate(data.updatedAt));
            },
            error: function () {
                alert('Phiên đăng nhập không hợp lệ hoặc token đã hết hạn.');
                redirectToLogin();
            }
        });
    }

    function loadUsers() {
        $('#users-table-body').html('<tr><td colspan="5" class="text-center">Đang tải...</td></tr>');
        $.ajax({
            type: 'GET',
            url: '/users',
            dataType: 'json',
            beforeSend: authHeader,
            success: function (users) {
                if (!users || users.length === 0) {
                    $('#users-table-body').html('<tr><td colspan="5" class="text-center text-secondary">Không có dữ liệu.</td></tr>');
                    return;
                }

                const rows = users.map(function (user) {
                    return '<tr>' +
                        '<td>' + (user.id ?? '') + '</td>' +
                        '<td>' + $('<div>').text(user.fullName || '').html() + '</td>' +
                        '<td>' + $('<div>').text(user.email || '').html() + '</td>' +
                        '<td>' + $('<div>').text(user.role || '').html() + '</td>' +
                        '<td>' + $('<div>').text(formatDate(user.createdAt)).html() + '</td>' +
                        '</tr>';
                }).join('');

                $('#users-table-body').html(rows);
            },
            error: function (xhr) {
                $('#users-table-body').html('<tr><td colspan="5" class="text-center text-danger">Không tải được danh sách. HTTP ' + xhr.status + '</td></tr>');
            }
        });
    }

    function renderTokenInfo() {
        const currentToken = localStorage.getItem('token') || '';
        $('#token-value').val(currentToken);

        const decoded = decodeJwt(currentToken);
        if (!decoded) {
            $('#token-header').text('Token không hợp lệ hoặc chưa có token.');
            $('#token-payload').text('Token không hợp lệ hoặc chưa có token.');
            $('#jwt-exp-summary').text('-');
            return;
        }

        $('#token-header').text(JSON.stringify(decoded.header, null, 2));
        $('#token-payload').text(JSON.stringify(decoded.payload, null, 2));
        $('#jwt-alg').text(decoded.header.alg || '-');

        if (decoded.payload.exp) {
            const expDate = new Date(decoded.payload.exp * 1000);
            $('#jwt-exp-summary').text(expDate.toLocaleString());
        } else {
            $('#jwt-exp-summary').text('Không có exp');
        }
    }

    function testApi(url, withToken) {
        $('#api-status').text('Đang gửi...');
        $('#api-result').text('Đang gửi request tới ' + url + ' ...');

        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            beforeSend: withToken ? authHeader : undefined,
            success: function (data, textStatus, xhr) {
                $('#api-status').text(xhr.status + ' ' + xhr.statusText);
                $('#api-result').text(JSON.stringify(data, null, 2));
            },
            error: function (xhr) {
                $('#api-status').text(xhr.status + ' ' + xhr.statusText);
                let result = xhr.responseText;
                try {
                    result = JSON.stringify(JSON.parse(xhr.responseText), null, 2);
                } catch (e) {
                    if (!result) result = 'Request bị từ chối.';
                }
                $('#api-result').text(result);
            }
        });
    }

    // Login page
    $('#login').click(function () {
        const email = $('#email').val();
        const password = $('#password').val();

        if (!email || !password) {
            alert('Vui lòng nhập email và password.');
            return;
        }

        $.ajax({
            type: 'POST',
            url: '/auth/login',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({ email: email, password: password }),
            success: function (data) {
                localStorage.setItem('token', data.token);
                window.location.href = '/user/profile';
            },
            error: function (xhr) {
                alert('Đăng nhập thất bại. HTTP ' + xhr.status);
            }
        });
    });

    // Dashboard page
    if ($('.dashboard-section').length) {
        if (!token) {
            redirectToLogin();
            return;
        }
        renderTokenInfo();
        loadProfile();
    }

    $('.dashboard-action').click(function () {
        $('.dashboard-action').removeClass('btn-primary active').addClass('btn-outline-primary');
        $(this).removeClass('btn-outline-primary').addClass('btn-primary active');

        $('.dashboard-section').addClass('d-none');
        $('#' + $(this).data('target')).removeClass('d-none');

        if ($(this).data('target') === 'section-token') renderTokenInfo();
    });

    $('#refresh-profile').click(loadProfile);
    $('#load-users').click(loadUsers);

    $('#copy-token').click(function () {
        const currentToken = localStorage.getItem('token') || '';
        if (!currentToken) {
            showMessage('Không có token để copy.', 'warning');
            return;
        }
        navigator.clipboard.writeText(currentToken).then(function () {
            showMessage('Đã copy JWT token.', 'success');
        }).catch(function () {
            $('#token-value').trigger('select');
            document.execCommand('copy');
            showMessage('Đã copy JWT token.', 'success');
        });
    });

    $('#test-me-api').click(function () { testApi('/users/me', true); });
    $('#test-users-api').click(function () { testApi('/users', true); });
    $('#test-without-token').click(function () { testApi('/users/me', false); });

    $('#logout').click(function () {
        localStorage.clear();
        window.location.href = '/login';
    });
});
