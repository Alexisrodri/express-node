import { Response } from "express";
import { AppDataSource } from "../data-source";
import { MgmPacientes } from "../entities/MgmPacientes";
import { DafTiposIdentificacion } from "../entities/DafTiposIdentificacion";
import { successResponse, errorResponse, paginatedResponse } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function getNextSequenceId(): Promise<number> {
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
}

export const createPaciente = async (req: AuthRequest, res: Response) => {
  try {
    const {
      codigoTipoIdentificacion,
      numeroIdentificacion,
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
      email,
    } = req.body;

    if (!codigoTipoIdentificacion || !numeroIdentificacion || !primerNombre || !primerApellido || !email) {
      return res.status(400).json(
        errorResponse("Campos requeridos: codigoTipoIdentificacion, numeroIdentificacion, primerNombre, primerApellido, email")
      );
    }

    if (!isValidEmail(email)) {
      return res.status(400).json(
        errorResponse("Email inválido")
      );
    }

    const tipoIdentificacion = await AppDataSource.getRepository(DafTiposIdentificacion).findOne({
      where: { codigoTipoIdentificacion, estado: "A" },
    });

    if (!tipoIdentificacion) {
      return res.status(400).json(
        errorResponse("El tipo de identificación no existe o está inactivo")
      );
    }

    const pacienteExistente = await AppDataSource.getRepository(MgmPacientes).findOne({
      where: { numeroIdentificacion },
    });

    if (pacienteExistente) {
      return res.status(400).json(
        errorResponse("Ya existe un paciente con este número de identificación")
      );
    }

    const idPaciente = await getNextSequenceId();

    const paciente = new MgmPacientes();
    paciente.idPaciente = idPaciente;
    paciente.codigoTipoIdentificacion = codigoTipoIdentificacion;
    paciente.numeroIdentificacion = numeroIdentificacion;
    paciente.primerNombre = primerNombre;
    paciente.segundoNombre = segundoNombre || null;
    paciente.primerApellido = primerApellido;
    paciente.segundoApellido = segundoApellido || null;
    paciente.email = email;
    paciente.estado = "A";
    paciente.fechaIngreso = new Date();
    paciente.usuarioIngreso = req.user?.username || "SYSTEM";

    await paciente.generarNombreCompleto();

    await AppDataSource.getRepository(MgmPacientes).save(paciente);

    const pacienteGuardado = await AppDataSource.getRepository(MgmPacientes).findOne({
      where: { idPaciente: paciente.idPaciente },
      relations: ["tipoIdentificacion"],
    });

    return res.status(201).json(
      successResponse(pacienteGuardado, "Paciente creado exitosamente")
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse("Error al crear paciente", [error.message])
    );
  }
};

export const updatePaciente = async (req: AuthRequest, res: Response) => {
  try {
    const { idPaciente } = req.params;
    const {
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
      email,
    } = req.body;

    const paciente = await AppDataSource.getRepository(MgmPacientes).findOne({
      where: { idPaciente: parseInt(idPaciente) },
    });

    if (!paciente) {
      return res.status(404).json(
        errorResponse("Paciente no encontrado")
      );
    }

    if (req.body.codigoTipoIdentificacion || req.body.numeroIdentificacion) {
      return res.status(400).json(
        errorResponse("No se pueden modificar codigoTipoIdentificacion y numeroIdentificacion")
      );
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json(
        errorResponse("Email inválido")
      );
    }

    if (primerNombre) paciente.primerNombre = primerNombre;
    if (segundoNombre !== undefined) paciente.segundoNombre = segundoNombre || null;
    if (primerApellido) paciente.primerApellido = primerApellido;
    if (segundoApellido !== undefined) paciente.segundoApellido = segundoApellido || null;
    if (email) paciente.email = email;
    paciente.fechaModificacion = new Date();
    paciente.usuarioModificacion = req.user?.username || "SYSTEM";

    await paciente.generarNombreCompleto();
    await AppDataSource.getRepository(MgmPacientes).save(paciente);

    const pacienteActualizado = await AppDataSource.getRepository(MgmPacientes).findOne({
      where: { idPaciente: paciente.idPaciente },
      relations: ["tipoIdentificacion"],
    });

    return res.json(
      successResponse(pacienteActualizado, "Paciente actualizado exitosamente")
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse("Error al actualizar paciente", [error.message])
    );
  }
};

export const deletePaciente = async (req: AuthRequest, res: Response) => {
  try {
    const { idPaciente } = req.params;

    const paciente = await AppDataSource.getRepository(MgmPacientes).findOne({
      where: { idPaciente: parseInt(idPaciente) },
    });

    if (!paciente) {
      return res.status(404).json(
        errorResponse("Paciente no encontrado")
      );
    }

    paciente.estado = "I";
    paciente.fechaModificacion = new Date();
    paciente.usuarioModificacion = req.user?.username || "SYSTEM";

    await AppDataSource.getRepository(MgmPacientes).save(paciente);

    return res.json(
      successResponse(null, "Paciente inactivado exitosamente")
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse("Error al inactivar paciente", [error.message])
    );
  }
};

export const getPacienteById = async (req: AuthRequest, res: Response) => {
  try {
    const { idPaciente } = req.params;

    const paciente = await AppDataSource.getRepository(MgmPacientes).findOne({
      where: { idPaciente: parseInt(idPaciente) },
      relations: ["tipoIdentificacion"],
    });

    if (!paciente) {
      return res.status(404).json(
        errorResponse("Paciente no encontrado")
      );
    }

    return res.json(
      successResponse(paciente, "Paciente encontrado")
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse("Error al buscar paciente", [error.message])
    );
  }
};

export const getPacientes = async (req: AuthRequest, res: Response) => {
  try {
    const {
      numeroIdentificacion,
      nombreCompleto,
      email,
      estado,
      page = "1",
      pageSize = "10",
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 10;
    const skip = (pageNum - 1) * pageSizeNum;

    const queryBuilder = AppDataSource.getRepository(MgmPacientes)
      .createQueryBuilder("paciente")
      .leftJoinAndSelect("paciente.tipoIdentificacion", "tipoIdentificacion");

    if (numeroIdentificacion) {
      queryBuilder.andWhere("paciente.numeroIdentificacion = :numeroIdentificacion", {
        numeroIdentificacion,
      });
    }

    if (nombreCompleto) {
      queryBuilder.andWhere("UPPER(paciente.nombreCompleto) LIKE UPPER(:nombreCompleto)", {
        nombreCompleto: `%${nombreCompleto}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere("UPPER(paciente.email) LIKE UPPER(:email)", {
        email: `%${email}%`,
      });
    }

    if (estado) {
      queryBuilder.andWhere("paciente.estado = :estado", { estado });
    } else {
      queryBuilder.andWhere("paciente.estado = :estado", { estado: "A" });
    }

    const totalItems = await queryBuilder.getCount();
    const pacientes = await queryBuilder
      .skip(skip)
      .take(pageSizeNum)
      .orderBy("paciente.idPaciente", "DESC")
      .getMany();

    return res.json(
      paginatedResponse(pacientes, pageNum, pageSizeNum, totalItems, "Pacientes encontrados")
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse("Error al buscar pacientes", [error.message])
    );
  }
};

