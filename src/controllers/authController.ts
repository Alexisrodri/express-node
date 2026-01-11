import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "../utils/response";

const VALID_USERNAME = "VERIS";
const VALID_PASSWORD = "PRUEBAS123";

export const login = async (req: Request, res: Response) => {
  try {
    const { usuario, clave } = req.body;

    if (!usuario || !clave) {
      return res.status(400).json(
        errorResponse("Usuario y clave son requeridos")
      );
    }

    if (usuario !== VALID_USERNAME || clave !== VALID_PASSWORD) {
      return res.status(401).json(
        errorResponse("Credenciales inválidas")
      );
    }

    const secret = process.env.JWT_SECRET || "secret";
    const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

    const token = jwt.sign(
      { username: usuario },
      secret,
      { expiresIn }
    );

    return res.json(
      successResponse(
        { token, type: "Bearer" },
        "Autenticación exitosa"
      )
    );
  } catch (error) {
    return res.status(500).json(
      errorResponse("Error en el proceso de autenticación", [error])
    );
  }
};

