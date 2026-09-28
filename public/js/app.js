/**
 * ============================================================================
 * INTERFAZ CLIENTE INTERACTIVA - PROYECTO INTEGRADOR MÓDULOS 6, 7 & 8
 * Demuestra: JWT, Rutas Protegidas, Multer Upload, Relaciones ORM y Auditoría
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const consoleResponse = document.getElementById('consoleResponse');
    const consoleStatus = document.getElementById('consoleStatus');
    const tokenDisplay = document.getElementById('tokenDisplay');
    const tokenPayloadDisplay = document.getElementById('tokenPayloadDisplay');
    const activeUserBadge = document.getElementById('activeUserBadge');

    // Estado local del cliente
    let currentToken = localStorage.getItem('jwt_token') || '';
    let currentUser = null;

    try {
        if (currentToken) {
            currentUser = JSON.parse(localStorage.getItem('jwt_user')) || null;
            updateTokenUI(currentToken, currentUser);
        }
    } catch (e) {
        console.warn('Error leyendo estado inicial:', e);
    }

    // ========================================================================
    // NAVEGACIÓN POR TABS
    // ========================================================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // ========================================================================
    // CONSOLA EN VIVO
    // ========================================================================
    function printConsole(method, url, statusCode, data) {
        if (!consoleResponse) return;
        const color = statusCode >= 200 && statusCode < 300 ? '#10b981' : statusCode === 401 || statusCode === 403 ? '#f59e0b' : '#ef4444';
        consoleStatus.innerHTML = `<span style="color:${color}; font-weight:bold;">[${method}] ${url} &rarr; HTTP ${statusCode}</span>`;
        consoleResponse.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }

    // ========================================================================
    // UTILIDADES JWT
    // ========================================================================
    function updateTokenUI(token, user) {
        if (token) {
            tokenDisplay.textContent = token;
            if (activeUserBadge) {
                activeUserBadge.textContent = user ? `${user.nombre} (${user.rol})` : 'Sesión activa';
                activeUserBadge.className = 'badge badge-success';
            }
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                tokenPayloadDisplay.textContent = JSON.stringify(JSON.parse(jsonPayload), null, 2);
            } catch (err) {
                tokenPayloadDisplay.textContent = 'Token payload no decodificable.';
            }
        } else {
            tokenDisplay.textContent = 'Ningún token almacenado. Inicie sesión para generar uno.';
            tokenPayloadDisplay.textContent = 'Sin payload activo.';
            if (activeUserBadge) {
                activeUserBadge.textContent = 'Sin autenticar';
                activeUserBadge.className = 'badge';
            }
        }
    }

    // Botón Copiar Token
    const btnCopyToken = document.getElementById('btnCopyToken');
    if (btnCopyToken) {
        btnCopyToken.addEventListener('click', () => {
            if (!currentToken) return alert('No hay ningún token activo para copiar.');
            navigator.clipboard.writeText(currentToken);
            alert('¡Token JWT copiado al portapapeles!');
        });
    }

    // Botón Cerrar Sesión
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            currentToken = '';
            currentUser = null;
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('jwt_user');
            updateTokenUI('', null);
            printConsole('AUTH', 'Logout', 200, { message: 'Sesión local cerrada. Token removido.' });
        });
    }

    // ========================================================================
    // MÓDULO 8: AUTENTICACIÓN (LOGIN & REGISTER)
    // ========================================================================

    // Login rápido de prueba (Admin, Cliente, Operador)
    window.quickLogin = async (email, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            printConsole('POST', '/api/auth/login', res.status, data);

            if (res.ok && data.data && data.data.token) {
                currentToken = data.data.token;
                currentUser = data.data.usuario;
                localStorage.setItem('jwt_token', currentToken);
                localStorage.setItem('jwt_user', JSON.stringify(currentUser));
                updateTokenUI(currentToken, currentUser);
            }
        } catch (error) {
            printConsole('POST', '/api/auth/login', 500, { error: error.message });
        }
    };

    // Formulario de Login Personalizado
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await window.quickLogin(email, password);
        });
    }

    // Formulario de Registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('regNombre').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const rol = document.getElementById('regRol').value;
            const biografia = document.getElementById('regBio').value;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, password, rol, biografia })
                });
                const data = await res.json();
                printConsole('POST', '/api/auth/register', res.status, data);

                if (res.ok && data.data && data.data.token) {
                    currentToken = data.data.token;
                    currentUser = data.data.usuario;
                    localStorage.setItem('jwt_token', currentToken);
                    localStorage.setItem('jwt_user', JSON.stringify(currentUser));
                    updateTokenUI(currentToken, currentUser);
                    alert('¡Usuario registrado y autenticado exitosamente!');
                }
            } catch (error) {
                printConsole('POST', '/api/auth/register', 500, { error: error.message });
            }
        });
    }

    // ========================================================================
    // TESTS DE RUTAS PROTEGIDAS CON / SIN TOKEN (LECCIÓN 4)
    // ========================================================================

    // Test 1: Probar Ruta Protegida CON Token
    const btnTestProtectedWithToken = document.getElementById('btnTestProtectedWithToken');
    if (btnTestProtectedWithToken) {
        btnTestProtectedWithToken.addEventListener('click', async () => {
            if (!currentToken) {
                return alert('Primero debe iniciar sesión para enviar un token válido.');
            }
            try {
                const res = await fetch('/api/auth/perfil', {
                    headers: {
                        'Authorization': `Bearer ${currentToken}`
                    }
                });
                const data = await res.json();
                printConsole('GET', '/api/auth/perfil (CON Token)', res.status, data);
            } catch (err) {
                printConsole('GET', '/api/auth/perfil', 500, { error: err.message });
            }
        });
    }

    // Test 2: Probar Ruta Protegida SIN Token (Demuestra 401 Unauthorized)
    const btnTestProtectedNoToken = document.getElementById('btnTestProtectedNoToken');
    if (btnTestProtectedNoToken) {
        btnTestProtectedNoToken.addEventListener('click', async () => {
            try {
                // Petición deliberadamente sin cabecera Authorization
                const res = await fetch('/api/auth/perfil');
                const data = await res.json();
                printConsole('GET', '/api/auth/perfil (SIN Token)', res.status, data);
            } catch (err) {
                printConsole('GET', '/api/auth/perfil', 500, { error: err.message });
            }
        });
    }

    // Test 3: Probar Ruta Protegida con Token Manipulado / Inválido (Demuestra 403 Forbidden)
    const btnTestProtectedInvalidToken = document.getElementById('btnTestProtectedInvalidToken');
    if (btnTestProtectedInvalidToken) {
        btnTestProtectedInvalidToken.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/auth/perfil', {
                    headers: {
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature'
                    }
                });
                const data = await res.json();
                printConsole('GET', '/api/auth/perfil (Token Inválido)', res.status, data);
            } catch (err) {
                printConsole('GET', '/api/auth/perfil', 500, { error: err.message });
            }
        });
    }

    // ========================================================================
    // MÓDULO 8: SUBIDA DE ARCHIVOS CON MULTER (LECCIÓN 3 & PLUS)
    // ========================================================================

    const uploadForm = document.getElementById('uploadForm');
    const uploadInput = document.getElementById('uploadFileInput');
    const avatarPreviewImg = document.getElementById('avatarPreviewImg');
    const uploadResultUrl = document.getElementById('uploadResultUrl');

    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    avatarPreviewImg.src = re.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!uploadInput.files || uploadInput.files.length === 0) {
                return alert('Por favor seleccione un archivo para subir.');
            }

            const file = uploadInput.files[0];
            const formData = new FormData();
            formData.append('archivo', file);

            const associateWithUser = document.getElementById('chkAssociateUser').checked;
            const targetUserId = document.getElementById('targetUserIdSelect').value;

            let endpoint = '/api/upload';
            const headers = {};

            if (associateWithUser) {
                endpoint = `/api/usuarios/${targetUserId}/avatar`;
                if (!currentToken) {
                    return alert('Para asociar el avatar a un usuario en BD, debe haber iniciado sesión (se requiere JWT).');
                }
                headers['Authorization'] = `Bearer ${currentToken}`;
            }

            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: formData
                });
                const data = await res.json();
                printConsole('POST', endpoint, res.status, data);

                if (res.ok) {
                    const publicUrl = data.data.urlPublica || data.data.avatarUrl;
                    if (publicUrl) {
                        uploadResultUrl.innerHTML = `Archivo accesible públicamente en: <a href="${publicUrl}" target="_blank" style="color:#38bdf8;">${publicUrl}</a>`;
                        avatarPreviewImg.src = publicUrl;
                    }
                    alert('¡Archivo subido exitosamente con Multer!');
                } else {
                    alert('Error en subida: ' + (data.message || 'Error desconocido'));
                }
            } catch (err) {
                printConsole('POST', endpoint, 500, { error: err.message });
            }
        });
    }

    // ========================================================================
    // MÓDULO 7: GESTIÓN DE DATOS & RELACIONES ORM (1:1, 1:N, N:M)
    // ========================================================================

    const btnLoadRelationsTable = document.getElementById('btnLoadRelationsTable');
    const relationsContainer = document.getElementById('relationsContainer');
    const relationsTableBody = document.querySelector('#relationsTable tbody');

    if (btnLoadRelationsTable) {
        btnLoadRelationsTable.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/usuarios/relaciones');
                const json = await res.json();
                printConsole('GET', '/api/usuarios/relaciones', res.status, json);

                if (json.data && json.data.usuarios) {
                    relationsTableBody.innerHTML = '';
                    json.data.usuarios.forEach(u => {
                        const perfilBio = u.perfil ? u.perfil.biografia : 'Sin perfil';
                        const perfilAvatar = u.avatar || (u.perfil ? u.perfil.avatar : '/uploads/default-avatar.png');
                        
                        let pedidosHtml = '<em>Sin pedidos</em>';
                        if (u.pedidos && u.pedidos.length > 0) {
                            pedidosHtml = u.pedidos.map(p => {
                                const prods = p.productos && p.productos.length > 0
                                    ? p.productos.map(pr => `${pr.nombre} (x${pr.OrderProduct.cantidad})`).join(', ')
                                    : 'Sin productos vinculados';
                                return `<div><strong>${p.numeroPedido}</strong>: ${p.descripcion} ($${p.total})<br><small style="color:#94a3b8;">N:M Productos: ${prods}</small></div>`;
                            }).join('<hr style="border-color:rgba(255,255,255,0.05); margin:4px 0;">');
                        }

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${u.id}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <img src="${perfilAvatar}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1px solid #38bdf8;">
                                    <div>
                                        <strong>${u.nombre}</strong><br>
                                        <small style="color:#94a3b8;">${u.email}</small>
                                    </div>
                                </div>
                            </td>
                            <td><span class="badge ${u.rol === 'admin' ? 'badge-success' : 'badge-purple'}">${u.rol}</span></td>
                            <td style="max-width:200px;"><small>${perfilBio}</small></td>
                            <td>${pedidosHtml}</td>
                        `;
                        relationsTableBody.appendChild(tr);
                    });
                    relationsContainer.style.display = 'block';
                    relationsContainer.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                printConsole('GET', '/api/usuarios/relaciones', 500, { error: err.message });
            }
        });
    }

    // Simulación de Transacción ACID (Commit)
    const btnTxCommit = document.getElementById('btnTxCommit');
    if (btnTxCommit) {
        btnTxCommit.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/usuarios/transaccion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        usuario: {
                            nombre: 'Usuario ACID Commit',
                            email: `acid.commit.${Date.now()}@example.com`,
                            rol: 'cliente'
                        },
                        pedido: {
                            descripcion: 'Pedido Atómico Confirmado',
                            total: 129.90
                        },
                        forceError: false
                    })
                });
                const data = await res.json();
                printConsole('POST', '/api/usuarios/transaccion (Commit)', res.status, data);
            } catch (err) {
                printConsole('POST', '/api/usuarios/transaccion', 500, { error: err.message });
            }
        });
    }

    // Simulación de Transacción ACID (Rollback forzado)
    const btnTxRollback = document.getElementById('btnTxRollback');
    if (btnTxRollback) {
        btnTxRollback.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/usuarios/transaccion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        usuario: {
                            nombre: 'Usuario ACID Rollback',
                            email: `acid.rollback.${Date.now()}@example.com`,
                            rol: 'cliente'
                        },
                        pedido: {
                            descripcion: 'Pedido que abortará',
                            total: 99.00
                        },
                        forceError: true
                    })
                });
                const data = await res.json();
                printConsole('POST', '/api/usuarios/transaccion (Rollback Forzado)', res.status, data);
            } catch (err) {
                printConsole('POST', '/api/usuarios/transaccion', 500, { error: err.message });
            }
        });
    }

    // Benchmark SQL Manual vs ORM
    const btnCompareSqlOrm = document.getElementById('btnCompareSqlOrm');
    if (btnCompareSqlOrm) {
        btnCompareSqlOrm.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/usuarios/comparativa-sql-orm');
                const data = await res.json();
                printConsole('GET', '/api/usuarios/comparativa-sql-orm', res.status, data);
            } catch (err) {
                printConsole('GET', '/api/usuarios/comparativa-sql-orm', 500, { error: err.message });
            }
        });
    }

    // ========================================================================
    // MÓDULO 6: SISTEMA & LOGS EN ARCHIVO PLANO
    // ========================================================================

    const btnFetchStatus = document.getElementById('btnFetchStatus');
    if (btnFetchStatus) {
        btnFetchStatus.addEventListener('click', async () => {
            try {
                const res = await fetch('/status');
                const data = await res.json();
                printConsole('GET', '/status', res.status, data);
            } catch (err) {
                printConsole('GET', '/status', 500, { error: err.message });
            }
        });
    }

    const btnFetchLogs = document.getElementById('btnFetchLogs');
    if (btnFetchLogs) {
        btnFetchLogs.addEventListener('click', async () => {
            try {
                const res = await fetch('/logs');
                const text = await res.text();
                printConsole('GET', '/logs (log.txt)', res.status, text);
            } catch (err) {
                printConsole('GET', '/logs', 500, { error: err.message });
            }
        });
    }

    // Cargar usuarios en el selector de avatar al iniciar
    async function populateUserSelect() {
        try {
            const res = await fetch('/api/usuarios');
            const data = await res.json();
            const select = document.getElementById('targetUserIdSelect');
            if (select && data.data && data.data.usuarios) {
                select.innerHTML = '';
                data.data.usuarios.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.id;
                    opt.textContent = `ID ${u.id}: ${u.nombre} (${u.email})`;
                    select.appendChild(opt);
                });
            }
        } catch (e) {
            console.warn('Error cargando usuarios:', e);
        }
    }

    populateUserSelect();
});
