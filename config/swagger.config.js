/**
 * ============================================================================
 * CONFIGURACIÓN DE DOCUMENTACIÓN SWAGGER / OPENAPI 3.0
 * Módulo 8 - Tarea PLUS: Documentación interactiva de la API RESTful
 * ============================================================================
 */

const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Alkemy Node & Express Web App - RESTful API',
        version: '3.0.0',
        description: `
API RESTful profesional construida con Node.js, Express, Sequelize y MySQL.
Integra autenticación mediante JWT, relaciones ORM (1:1, 1:N, N:M), subida de archivos con Multer y persistencia en archivos planos de auditoría.

### Instrucciones de Autenticación:
1. Diríjase a la sección **Autenticación** y ejecute el endpoint \`POST /api/auth/login\` o regístrese con \`POST /api/auth/register\`.
2. Copie el token retornado en la respuesta.
3. Haga clic en el botón superior **Authorize 🔓** e ingrese el token en el formato: \`Bearer <su_token_jwt>\`.
4. ¡Listo! Ya puede interactuar con los endpoints protegidos.
        `,
        contact: {
            name: 'Sebastián Sánchez - Alkemy Backend Student',
            email: 'seba.sanchez@example.com'
        }
    },
    servers: [
        {
            url: 'http://localhost:3001',
            description: 'Servidor de Desarrollo Local (Puerto 3001)'
        },
        {
            url: 'http://localhost:3000',
            description: 'Servidor Local Alternativo (Puerto 3000)'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Ingrese el token JWT obtenido tras iniciar sesión con POST /api/auth/login'
            }
        },
        schemas: {
            Usuario: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    nombre: { type: 'string', example: 'Sebastián Sánchez' },
                    email: { type: 'string', example: 'admin@alkemy.com' },
                    rol: { type: 'string', enum: ['admin', 'cliente', 'operador'], example: 'admin' },
                    estado: { type: 'boolean', example: true },
                    avatar: { type: 'string', example: '/uploads/avatar-admin.png' }
                }
            },
            Perfil: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    usuarioId: { type: 'integer', example: 1 },
                    biografia: { type: 'string', example: 'Líder Técnico Backend' },
                    telefono: { type: 'string', example: '+56 9 1234 5678' },
                    direccion: { type: 'string', example: 'Av. Providencia 1234' },
                    avatar: { type: 'string', example: '/uploads/avatar-admin.png' }
                }
            },
            Pedido: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    numeroPedido: { type: 'string', example: 'PED-2026-001' },
                    descripcion: { type: 'string', example: 'Licencia Servidor Backend Cloud Pro' },
                    total: { type: 'number', format: 'float', example: 249.98 },
                    estado: { type: 'string', enum: ['pendiente', 'pagado', 'enviado', 'cancelado'], example: 'pagado' },
                    usuarioId: { type: 'integer', example: 1 }
                }
            },
            Producto: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    nombre: { type: 'string', example: 'Licencia Servidor Cloud Pro' },
                    categoria: { type: 'string', example: 'Infraestructura Cloud' },
                    precio: { type: 'number', example: 199.99 },
                    stock: { type: 'integer', example: 50 }
                }
            },
            ApiResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Operación realizada exitosamente.' },
                    data: { type: 'object' }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'error' },
                    message: { type: 'string', example: 'Descripción detallada del error ocurrido.' }
                }
            }
        }
    },
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Autenticación'],
                summary: 'Registrar un nuevo usuario en la base de datos',
                description: 'Crea un usuario con contraseña cifrada (bcrypt), inicializa su perfil 1:1 y retorna un token JWT válido.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['nombre', 'email', 'password'],
                                properties: {
                                    nombre: { type: 'string', example: 'Andrés Valenzuela' },
                                    email: { type: 'string', example: 'andres@example.com' },
                                    password: { type: 'string', example: 'PasswordSegura2026!' },
                                    rol: { type: 'string', enum: ['admin', 'cliente', 'operador'], example: 'cliente' },
                                    biografia: { type: 'string', example: 'Estudiante de desarrollo backend.' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Usuario registrado exitosamente', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
                    400: { description: 'Datos requeridos faltantes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                    409: { description: 'Correo ya registrado' }
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Autenticación'],
                summary: 'Iniciar sesión y obtener token JWT',
                description: 'Verifica las credenciales del usuario y genera un JWT firmado con expiración de 2 horas.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'admin@alkemy.com' },
                                    password: { type: 'string', example: 'AdminPassword123!' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Autenticación exitosa', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
                    401: { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
                }
            }
        },
        '/api/auth/perfil': {
            get: {
                tags: ['Autenticación'],
                summary: 'Obtener perfil del usuario autenticado (Protegida)',
                security: [{ bearerAuth: [] }],
                description: 'Ruta protegida por JWT. Retorna la información del usuario autenticado junto a su perfil 1:1 y pedidos 1:N.',
                responses: {
                    200: { description: 'Perfil recuperado con éxito' },
                    401: { description: 'Token no proporcionado o expirado' },
                    403: { description: 'Token no válido' }
                }
            }
        },
        '/api/usuarios': {
            get: {
                tags: ['Usuarios'],
                summary: 'Listar todos los usuarios con filtros opcionales',
                parameters: [
                    { name: 'nombre', in: 'query', schema: { type: 'string' }, description: 'Búsqueda por nombre parcial' },
                    { name: 'rol', in: 'query', schema: { type: 'string', enum: ['admin', 'cliente', 'operador'] } },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
                ],
                responses: {
                    200: { description: 'Lista de usuarios obtenida' }
                }
            },
            post: {
                tags: ['Usuarios'],
                summary: 'Crear usuario nuevo',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['nombre', 'email', 'password'],
                                properties: {
                                    nombre: { type: 'string', example: 'Nuevo Usuario' },
                                    email: { type: 'string', example: 'nuevo@example.com' },
                                    password: { type: 'string', example: 'MiClaveSecreta123' },
                                    rol: { type: 'string', example: 'cliente' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Usuario creado exitosamente' }
                }
            }
        },
        '/api/usuarios/{id}': {
            get: {
                tags: ['Usuarios'],
                summary: 'Obtener usuario por ID con perfil y pedidos',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Usuario encontrado' },
                    404: { description: 'Usuario no encontrado' }
                }
            },
            put: {
                tags: ['Usuarios'],
                summary: 'Actualizar campos controlados de un usuario (Protegida con JWT)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nombre: { type: 'string', example: 'Sebastián Sánchez Actualizado' },
                                    rol: { type: 'string', enum: ['admin', 'cliente', 'operador'], example: 'admin' },
                                    estado: { type: 'boolean', example: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Usuario actualizado exitosamente' },
                    401: { description: 'Acceso no autorizado (falta JWT)' },
                    404: { description: 'Usuario no encontrado' }
                }
            },
            delete: {
                tags: ['Usuarios'],
                summary: 'Eliminar usuario (Protegida con JWT - Rol Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Usuario eliminado' },
                    401: { description: 'No autenticado' },
                    403: { description: 'Permisos insuficientes (requiere rol admin)' }
                }
            }
        },
        '/api/usuarios/{id}/avatar': {
            post: {
                tags: ['Usuarios', 'Subida de Archivos'],
                summary: 'Asociar foto de perfil a un usuario (Protegida con JWT)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    archivo: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'Archivo de imagen (JPG, PNG, WEBP max 5MB)'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Avatar actualizado y guardado en la base de datos' },
                    400: { description: 'Archivo inválido o excede tamaño permitido' },
                    401: { description: 'No autenticado' }
                }
            }
        },
        '/api/usuarios/relaciones': {
            get: {
                tags: ['Usuarios'],
                summary: 'Consultar usuarios con relaciones completas: 1:1, 1:N y N:M (Eager Loading)',
                description: 'Recupera usuarios con su perfil (1:1), sus pedidos (1:N) y los productos incluidos en cada pedido (N:M).',
                responses: {
                    200: { description: 'Estructura relacional cargada exitosamente' }
                }
            }
        },
        '/api/pedidos': {
            get: {
                tags: ['Pedidos'],
                summary: 'Listar todos los pedidos',
                parameters: [
                    { name: 'estado', in: 'query', schema: { type: 'string', enum: ['pendiente', 'pagado', 'enviado', 'cancelado'] } },
                    { name: 'usuarioId', in: 'query', schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Lista de pedidos' }
                }
            },
            post: {
                tags: ['Pedidos'],
                summary: 'Crear nuevo pedido vinculando productos N:M (Protegida con JWT)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['descripcion', 'total'],
                                properties: {
                                    descripcion: { type: 'string', example: 'Plan de Licenciamiento Anual Cloud' },
                                    total: { type: 'number', example: 299.99 },
                                    usuarioId: { type: 'integer', example: 1 },
                                    productos: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                productoId: { type: 'integer', example: 1 },
                                                cantidad: { type: 'integer', example: 2 }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Pedido creado exitosamente' },
                    401: { description: 'Token no proporcionado' }
                }
            }
        },
        '/api/pedidos/{id}': {
            get: {
                tags: ['Pedidos'],
                summary: 'Obtener detalle de pedido por ID',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                responses: {
                    200: { description: 'Pedido encontrado' },
                    404: { description: 'Pedido no encontrado' }
                }
            }
        },
        '/api/pedidos/{id}/estado': {
            put: {
                tags: ['Pedidos'],
                summary: 'Actualizar estado de un pedido (Protegida con JWT)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['estado'],
                                properties: {
                                    estado: { type: 'string', enum: ['pendiente', 'pagado', 'enviado', 'cancelado'], example: 'pagado' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Estado actualizado' },
                    401: { description: 'No autorizado' }
                }
            }
        },
        '/api/upload': {
            post: {
                tags: ['Subida de Archivos'],
                summary: 'Cargar archivo general al servidor con Multer',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    archivo: {
                                        type: 'string',
                                        format: 'binary',
                                        description: 'Archivo soportado: JPG, PNG, WEBP, GIF, PDF (máx. 5MB)'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Archivo cargado con éxito y URL pública retornada' },
                    400: { description: 'Tipo no soportado o archivo superior a 5MB' }
                }
            }
        }
    }
};

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinition, {
        customCss: `
            .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #3b82f6; }
            .swagger-ui .info { margin: 25px 0; }
            .swagger-ui .btn.authorize { background-color: #10b981; color: white; border-color: #10b981; }
        `,
        customSiteTitle: 'Documentación API RESTful - Alkemy Módulo 8'
    }));
    console.log(' [Docs] Documentación Swagger/OpenAPI activa en: /api-docs');
};

module.exports = {
    setupSwagger,
    swaggerDefinition
};
