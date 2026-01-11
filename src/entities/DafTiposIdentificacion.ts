import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";
import { MgmPacientes } from "./MgmPacientes";

@Entity("DAF_TIPOS_IDENTIFICACION")
export class DafTiposIdentificacion {
  @PrimaryColumn({ name: "CODIGO_TIPO_IDENTIFICACION", type: "varchar2", length: 10 })
  codigoTipoIdentificacion!: string;

  @Column({ name: "NOMBRE_TIPO_IDENTIFICACION", type: "varchar2", length: 100 })
  nombreTipoIdentificacion!: string;

  @Column({ name: "ESTADO", type: "varchar2", length: 1, default: "A" })
  estado!: string;

  @OneToMany(() => MgmPacientes, (paciente) => paciente.tipoIdentificacion)
  pacientes!: MgmPacientes[];
}

