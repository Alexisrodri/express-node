import "reflect-metadata";
import express from "express";
import http from "http";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/authRoutes";
import pacientesRoutes from "./routes/pacientesRoutes";
import { DafTiposIdentificacion } from "./entities/DafTiposIdentificacion";
import { MgmPacientes } from "./entities/MgmPacientes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/autenticacion", authRoutes);
app.use("/pacientes", pacientesRoutes);

app.get("/health", (req, res) => {
  res.json({ status: true, message: "API funcionando correctamente" });
});

async function waitForOracle(maxRetries = 30, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      console.log("Conexión a la base de datos establecida");
      return true;
    } catch (error: any) {
      if (i < maxRetries - 1) {
        console.log(`Esperando a que Oracle esté disponible... (intento ${i + 1}/${maxRetries})`);
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

async function initializeDatabase() {
  try {
    await waitForOracle();
    
    console.log("Base de datos lista (tablas ya creadas por script SQL)");

    await seedData();
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
}

async function seedData() {
  try {
    const tipoRepo = AppDataSource.getRepository(DafTiposIdentificacion);
    const pacienteRepo = AppDataSource.getRepository(MgmPacientes);

    const tiposCount = await tipoRepo.count();
    if (tiposCount === 0) {
      console.log("Insertando tipos de identificación...");
      const tipos = [
        { codigoTipoIdentificacion: "CC", nombreTipoIdentificacion: "Cédula de Ciudadanía", estado: "A" },
        { codigoTipoIdentificacion: "CE", nombreTipoIdentificacion: "Cédula de Extranjería", estado: "A" },
        { codigoTipoIdentificacion: "TI", nombreTipoIdentificacion: "Tarjeta de Identidad", estado: "A" },
        { codigoTipoIdentificacion: "PA", nombreTipoIdentificacion: "Pasaporte", estado: "A" },
      ];

      for (const tipo of tipos) {
        try {
          const tipoEntity = tipoRepo.create(tipo);
          await tipoRepo.save(tipoEntity);
        } catch (error: any) {
          if (!error.message?.includes('unique constraint')) {
            console.warn(`Error al insertar tipo ${tipo.codigoTipoIdentificacion}:`, error.message);
          }
        }
      }

      console.log("Tipos de identificación verificados");
    } else {
      console.log(`Ya existen ${tiposCount} tipos de identificación`);
    }

    const pacientesCount = await pacienteRepo.count();
    if (pacientesCount === 0) {
      console.log("Insertando pacientes de ejemplo...");
      const getNextId = async (): Promise<number> => {
        const queryRunner = AppDataSource.createQueryRunner();
        try {
          await queryRunner.connect();
          const result = await queryRunner.query(
            "SELECT MGM_SEQ_PACIENT.NEXTVAL AS next_id FROM DUAL"
          );
          return result[0].NEXT_ID;
        } finally {
          await queryRunner.release();
        }
      };

      const paciente1 = new MgmPacientes();
      paciente1.idPaciente = await getNextId();
      paciente1.codigoTipoIdentificacion = "CC";
      paciente1.numeroIdentificacion = "1234567890";
      paciente1.primerNombre = "Juan";
      paciente1.segundoNombre = "Carlos";
      paciente1.primerApellido = "Pérez";
      paciente1.segundoApellido = "García";
      paciente1.email = "juan.perez@example.com";
      paciente1.estado = "A";
      paciente1.fechaIngreso = new Date();
      paciente1.usuarioIngreso = "SYSTEM";
      await paciente1.generarNombreCompleto();
      await pacienteRepo.save(paciente1);

      const paciente2 = new MgmPacientes();
      paciente2.idPaciente = await getNextId();
      paciente2.codigoTipoIdentificacion = "CE";
      paciente2.numeroIdentificacion = "9876543210";
      paciente2.primerNombre = "María";
      paciente2.primerApellido = "González";
      paciente2.segundoApellido = "López";
      paciente2.email = "maria.gonzalez@example.com";
      paciente2.estado = "A";
      paciente2.fechaIngreso = new Date();
      paciente2.usuarioIngreso = "SYSTEM";
      await paciente2.generarNombreCompleto();
      await pacienteRepo.save(paciente2);

      console.log("Pacientes de ejemplo insertados");
    } else {
      console.log(`Ya existen ${pacientesCount} pacientes`);
    }
  } catch (error: any) {
    console.warn("Advertencia al poblar datos (puede que ya existan):", error.message);
  }
}

async function createSequence() {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    const sequenceExists = await queryRunner.query(
      `SELECT COUNT(*) AS count FROM user_sequences WHERE sequence_name = 'MGM_SEQ_PACIENT'`
    );

    if (sequenceExists[0].COUNT === 0) {
      await queryRunner.query(
        `CREATE SEQUENCE MGM_SEQ_PACIENT START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE`
      );
      console.log("Secuencia MGM_SEQ_PACIENT creada");
    }

    await queryRunner.release();
  } catch (error) {
    console.error("Error al crear secuencia (puede que ya exista):", error);
  }
}

async function startServer() {
  try {
    await initializeDatabase();
    await createSequence();

    const server: http.Server = app.listen(PORT, () => {
      console.log(`✅ Servidor ejecutándose en el puerto ${PORT}`);
      console.log(`📍 API disponible en: http://localhost:${PORT}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
        console.error(`\n💡 Soluciones:`);
        console.error(`   1. Encontrar el proceso: netstat -ano | findstr :${PORT}`);
        console.error(`   2. Cerrar el proceso: taskkill /F /PID <número_del_PID>`);
        console.error(`   3. O cambiar el puerto en .env: PORT=3001`);
        console.error(`   4. Si es una instancia anterior, espera unos segundos o reinicia el terminal\n`);
      } else {
        console.error("Error del servidor:", error);
      }
      process.exit(1);
    });
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
      console.error(`\n💡 Soluciones:`);
      console.error(`   1. Encontrar el proceso: netstat -ano | findstr :${PORT}`);
      console.error(`   2. Cerrar el proceso: taskkill /F /PID <número_del_PID>`);
      console.error(`   3. O cambiar el puerto en .env: PORT=3001\n`);
    } else {
      console.error("Error al iniciar el servidor:", error);
    }
    process.exit(1);
  }
}

startServer().catch((error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
    console.error(`\n💡 Soluciones:`);
    console.error(`   1. Encontrar el proceso: netstat -ano | findstr :${PORT}`);
    console.error(`   2. Cerrar el proceso: taskkill /F /PID <número_del_PID>`);
    console.error(`   3. O cambiar el puerto en .env: PORT=3001\n`);
  } else {
    console.error("Error al iniciar el servidor:", error);
  }
  process.exit(1);
});

