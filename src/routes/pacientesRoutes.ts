import { Router } from "express";
import {
  createPaciente,
  updatePaciente,
  deletePaciente,
  getPacienteById,
  getPacientes,
} from "../controllers/pacientesController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", createPaciente);
router.put("/:idPaciente", updatePaciente);
router.delete("/:idPaciente", deletePaciente);
router.get("/:idPaciente", getPacienteById);
router.get("/", getPacientes);

export default router;

