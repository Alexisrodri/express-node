import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from "typeorm";
import { DafTiposIdentificacion } from "./DafTiposIdentificacion";

@Entity("MGM_PACIENTES")
export class MgmPacientes {
  @PrimaryColumn({ name: "ID_PACIENTE", type: "number" })
  idPaciente!: number;

  @Column({ name: "CODIGO_TIPO_IDENTIFICACION", type: "varchar2", length: 10 })
  codigoTipoIdentificacion!: string;

  @Column({ name: "NUMERO_IDENTIFICACION", type: "varchar2", length: 20, unique: true })
  numeroIdentificacion!: string;

  @Column({ name: "PRIMER_NOMBRE", type: "varchar2", length: 100 })
  primerNombre!: string;

  @Column({ name: "SEGUNDO_NOMBRE", type: "varchar2", length: 100, nullable: true })
  segundoNombre?: string;

  @Column({ name: "PRIMER_APELLIDO", type: "varchar2", length: 100 })
  primerApellido!: string;

  @Column({ name: "SEGUNDO_APELLIDO", type: "varchar2", length: 100, nullable: true })
  segundoApellido?: string;

  @Column({ name: "NOMBRE_COMPLETO", type: "varchar2", length: 400 })
  nombreCompleto!: string;

  @Column({ name: "EMAIL", type: "varchar2", length: 200 })
  email!: string;

  @Column({ name: "ESTADO", type: "varchar2", length: 1, default: "A" })
  estado!: string;

  @Column({ name: "FECHA_INGRESO", type: "date", nullable: true })
  fechaIngreso?: Date;

  @Column({ name: "USUARIO_INGRESO", type: "varchar2", length: 50, nullable: true })
  usuarioIngreso?: string;

  @Column({ name: "FECHA_MODIFICACION", type: "date", nullable: true })
  fechaModificacion?: Date;

  @Column({ name: "USUARIO_MODIFICACION", type: "varchar2", length: 50, nullable: true })
  usuarioModificacion?: string;

  @ManyToOne(() => DafTiposIdentificacion, { eager: true })
  @JoinColumn({ name: "CODIGO_TIPO_IDENTIFICACION" })
  tipoIdentificacion!: DafTiposIdentificacion;

  @BeforeInsert()
  @BeforeUpdate()
  generarNombreCompleto() {
    const partes = [
      this.primerNombre,
      this.segundoNombre,
      this.primerApellido,
      this.segundoApellido
    ].filter(Boolean);
    this.nombreCompleto = partes.join(" ");
  }
}

