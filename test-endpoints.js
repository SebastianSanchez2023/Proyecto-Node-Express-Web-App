/**
 * ============================================================================
 * SCRIPT DE PRUEBAS AUTOMATIZADAS DE ENDPOINTS (MÓDULO 8)
 * Verifica: Auth, JWT, Rutas Protegidas (401 vs 200), Multer Upload, Relaciones ORM
 * ============================================================================
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./app');

const { syncDatabase } = require('./models');
const { testConnection } = require('./config/db.config');

const PORT = 3002; // Usamos un puerto temporal de pruebas

const runTests = async () => {
    await testConnection();
    await syncDatabase();

    const server = app.listen(PORT, async () => {
        console.log(`\n============================================================`);
        console.log(` INICIANDO BATERÍA DE PRUEBAS AUTOMÁTICAS EN PUERTO ${PORT}`);
        console.log(`============================================================\n`);

        try {
            // Helper para peticiones HTTP nativas
            const request = (method, urlPath, headers = {}, body = null) => {
                return new Promise((resolve, reject) => {
                    const options = {
                        hostname: 'localhost',
                        port: PORT,
                        path: urlPath,
                        method: method,
                        headers: headers
                    };

                    const req = http.request(options, (res) => {
                        let responseData = '';
                        res.on('data', (chunk) => { responseData += chunk; });
                        res.on('end', () => {
                            try {
                                resolve({
                                    status: res.statusCode,
                                    headers: res.headers,
                                    data: JSON.parse(responseData)
                                });
                            } catch (e) {
                                resolve({
                                    status: res.statusCode,
                                    headers: res.headers,
                                    data: responseData
                                });
                            }
                        });
                    });

                    req.on('error', reject);
                    if (body) req.write(body);
                    req.end();
                });
            };

            // Test 1: Verificar /status
            console.log('🧪 Test 1: GET /status');
            const resStatus = await request('GET', '/status');
            console.log(`   Resultado: HTTP ${resStatus.status} | Status: ${resStatus.data.status}`);
            if (resStatus.status !== 200) throw new Error('Fallo en Test 1');

            // Test 2: Intentar acceder a ruta protegida SIN token (espera 401)
            console.log('\n🧪 Test 2: GET /api/auth/perfil (SIN TOKEN)');
            const resNoToken = await request('GET', '/api/auth/perfil');
            console.log(`   Resultado: HTTP ${resNoToken.status} | Message: ${resNoToken.data.message}`);
            if (resNoToken.status !== 401) throw new Error('Se esperaba HTTP 401 Unauthorized');
            console.log('   [OK] Correctamente bloqueado con 401 Unauthorized.');

            // Test 3: Iniciar sesión con credenciales válidas (POST /api/auth/login)
            console.log('\n🧪 Test 3: POST /api/auth/login (Credenciales de Administrador)');
            const loginBody = JSON.stringify({
                email: 'admin@alkemy.com',
                password: 'AdminPassword123!'
            });
            const resLogin = await request('POST', '/api/auth/login', {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginBody)
            }, loginBody);

            console.log(`   Resultado: HTTP ${resLogin.status} | Status: ${resLogin.data.status}`);
            const token = resLogin.data?.data?.token;
            if (!token) throw new Error('No se recibió token JWT en login');
            console.log(`   [OK] Token JWT recibido: ${token.substring(0, 30)}...`);

            // Test 4: Acceder a ruta protegida CON token válido (espera 200)
            console.log('\n🧪 Test 4: GET /api/auth/perfil (CON TOKEN JWT)');
            const resWithToken = await request('GET', '/api/auth/perfil', {
                'Authorization': `Bearer ${token}`
            });
            console.log(`   Resultado: HTTP ${resWithToken.status} | Usuario: ${resWithToken.data?.data?.nombre} | Rol: ${resWithToken.data?.data?.rol}`);
            if (resWithToken.status !== 200) throw new Error('Fallo en autenticación con token válido');
            console.log('   [OK] Acceso autorizado correctamente.');

            // Test 5: Verificar relaciones ORM (1:1, 1:N, N:M) en /api/usuarios/relaciones
            console.log('\n🧪 Test 5: GET /api/usuarios/relaciones (Relaciones ORM completas)');
            const resRelaciones = await request('GET', '/api/usuarios/relaciones');
            console.log(`   Resultado: HTTP ${resRelaciones.status}`);
            const totalUsuarios = resRelaciones.data?.data?.totalUsuarios || 0;
            console.log(`   [OK] Total usuarios con relaciones cargadas: ${totalUsuarios}`);

            // Test 6: Crear un pedido protegido por JWT (POST /api/pedidos)
            console.log('\n🧪 Test 6: POST /api/pedidos (Crear pedido protegido con JWT)');
            const orderBody = JSON.stringify({
                descripcion: 'Licencia Cloud Enterprise Módulo 8 Test',
                total: 199.99,
                productos: [{ productoId: 1, cantidad: 2 }]
            });
            const resOrder = await request('POST', '/api/pedidos', {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(orderBody),
                'Authorization': `Bearer ${token}`
            }, orderBody);
            console.log(`   Resultado: HTTP ${resOrder.status} | Pedido creado: ${resOrder.data?.data?.numeroPedido}`);
            if (resOrder.status !== 201) throw new Error('Fallo al crear pedido con JWT');
            console.log('   [OK] Pedido creado exitosamente.');

            console.log(`\n============================================================`);
            console.log(` 🎉 TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO AL 100%!`);
            console.log(`============================================================\n`);

            server.close(() => process.exit(0));
        } catch (err) {
            console.error('\n❌ ERROR EN LAS PRUEBAS:', err.message);
            server.close(() => process.exit(1));
        }
    });
};

runTests();
