-- =============================================
-- PATCH 005: Notificaciones in-app y menciones en notas
-- Fecha: 2026-05-27
-- Descripción: Agrega sistema de notificaciones dentro de la aplicación
--              y soporte para @menciones en notas entre participantes del ticket
-- =============================================

USE SistemaTickets;
GO

-- =============================================
-- 1. Campo username en Usuarios
--    Formato: nombre.apellido en minúsculas sin espacios (ej: carlos.lopez)
--    Usado para el sistema de @menciones en notas
-- =============================================

ALTER TABLE Usuarios
ADD username VARCHAR(50) NULL;
GO

-- Generar username inicial para todos los usuarios existentes
UPDATE Usuarios
SET username = LOWER(
    REPLACE(nombre,   ' ', '') + '.' +
    REPLACE(apellido, ' ', '')
);
GO

-- Resolver duplicados: al segundo igual se le agrega '2', al tercero '3', etc.
-- El más antiguo conserva el username sin número
WITH Ordenados AS (
    SELECT
        id,
        username,
        ROW_NUMBER() OVER (PARTITION BY username ORDER BY creado_en ASC) AS rn
    FROM Usuarios
)
UPDATE u
SET u.username = o.username + CAST(o.rn AS VARCHAR(5))
FROM Usuarios u
INNER JOIN Ordenados o ON o.id = u.id
WHERE o.rn > 1;
GO

-- Convertir a NOT NULL y agregar restricción UNIQUE
ALTER TABLE Usuarios
ALTER COLUMN username VARCHAR(50) NOT NULL;
GO

ALTER TABLE Usuarios
ADD CONSTRAINT UQ_Usuarios_username UNIQUE (username);
GO

-- =============================================
-- 2. Tabla Notificaciones
--    Una fila por notificación por usuario.
--    El frontend la consulta para mostrar el ícono de campana.
-- =============================================

CREATE TABLE Notificaciones (
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    id_usuario  UNIQUEIDENTIFIER NOT NULL,
    tipo        VARCHAR(50)      NOT NULL,
    titulo      VARCHAR(255)     NOT NULL,
    mensaje     TEXT             NOT NULL,
    id_ticket   UNIQUEIDENTIFIER NULL,
    leida       BIT              NOT NULL DEFAULT 0,
    creado_en   DATETIME         NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Notificaciones          PRIMARY KEY (id),
    CONSTRAINT FK_Notificaciones_Usuario  FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    CONSTRAINT FK_Notificaciones_Ticket   FOREIGN KEY (id_ticket)  REFERENCES Tickets(id),
    CONSTRAINT CK_Notificaciones_tipo CHECK (tipo IN (
        'ticket_creado',
        'cambio_estado',
        'nueva_nota',
        'ticket_asignado',
        'mencion',
        'ticket_completado',
        'sin_asignar'
    ))
);
GO

-- Índice para la consulta más frecuente: notificaciones no leídas de un usuario
CREATE INDEX IX_Notificaciones_usuario_leida
ON Notificaciones (id_usuario, leida)
INCLUDE (creado_en, tipo, titulo);
GO

-- =============================================
-- 3. Tabla Nota_Menciones
--    Registra qué usuarios fueron mencionados (@username) en cada nota.
--    Solo se permiten menciones a participantes del ticket
--    (agente asignado, admins y cliente del ticket).
-- =============================================

CREATE TABLE Nota_Menciones (
    id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    id_nota               UNIQUEIDENTIFIER NOT NULL,
    id_usuario_mencionado UNIQUEIDENTIFIER NOT NULL,
    creado_en             DATETIME         NOT NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Nota_Menciones          PRIMARY KEY (id),
    CONSTRAINT FK_Nota_Menciones_Nota     FOREIGN KEY (id_nota)               REFERENCES Notas(id),
    CONSTRAINT FK_Nota_Menciones_Usuario  FOREIGN KEY (id_usuario_mencionado) REFERENCES Usuarios(id),
    CONSTRAINT UQ_Nota_Menciones          UNIQUE (id_nota, id_usuario_mencionado)
);
GO
