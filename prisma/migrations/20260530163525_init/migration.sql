-- CreateEnum
CREATE TYPE "NivelFormacion" AS ENUM ('LICENCIADO', 'ENFERMERO_PROFESIONAL', 'ENFERMERO_ESPECIALISTA', 'AUXILIAR');

-- CreateEnum
CREATE TYPE "PersonalEstado" AS ENUM ('ACTIVO', 'VACACIONES', 'LICENCIA_ENFERMEDAD', 'CAPACITACION');

-- CreateEnum
CREATE TYPE "PlanillaEstado" AS ENUM ('BORRADOR', 'CERRADA');

-- CreateEnum
CREATE TYPE "TurnoTipo" AS ENUM ('M', 'T', 'N', 'F');

-- CreateEnum
CREATE TYPE "AlertaNivel" AS ENUM ('YELLOW', 'ORANGE', 'RED');

-- CreateTable
CREATE TABLE "instituciones" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "logo_url" TEXT,
    "nivel_complejidad" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" UUID NOT NULL,
    "institucion_id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "especialidad_key" VARCHAR(100) NOT NULL,
    "camas" INTEGER NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal" (
    "id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "dni" VARCHAR(20) NOT NULL,
    "matricula" VARCHAR(50) NOT NULL,
    "nivel_formacion" "NivelFormacion" NOT NULL,
    "jornada_horas" INTEGER NOT NULL,
    "turno_fijo" "TurnoTipo",
    "antiguedad_anos" INTEGER NOT NULL,
    "estado" "PersonalEstado" NOT NULL DEFAULT 'ACTIVO',
    "compensatorio_pendiente" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planillas" (
    "id" UUID NOT NULL,
    "servicio_id" UUID NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "dias_mes" INTEGER NOT NULL,
    "feriados" INTEGER[],
    "estado" "PlanillaEstado" NOT NULL DEFAULT 'BORRADOR',

    CONSTRAINT "planillas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" UUID NOT NULL,
    "planilla_id" UUID NOT NULL,
    "personal_id" UUID NOT NULL,
    "dia" INTEGER NOT NULL,
    "tipo" "TurnoTipo" NOT NULL,
    "es_compensatorio" BOOLEAN NOT NULL DEFAULT false,
    "alerta_nivel" "AlertaNivel",
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dotaciones_calculadas" (
    "id" UUID NOT NULL,
    "planilla_id" UUID NOT NULL,
    "P" DECIMAL(5,2) NOT NULL,
    "B" DECIMAL(5,2) NOT NULL,
    "Z" DECIMAL(5,2) NOT NULL,
    "Q_manana" DECIMAL(5,2) NOT NULL,
    "Q_tarde" DECIMAL(5,2) NOT NULL,
    "Q_noche" DECIMAL(5,2) NOT NULL,
    "Q_franco" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "dotaciones_calculadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personal_dni_key" ON "personal"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "personal_matricula_key" ON "personal"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "turnos_planilla_id_personal_id_dia_key" ON "turnos"("planilla_id", "personal_id", "dia");

-- CreateIndex
CREATE UNIQUE INDEX "dotaciones_calculadas_planilla_id_key" ON "dotaciones_calculadas"("planilla_id");

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "instituciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal" ADD CONSTRAINT "personal_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planillas" ADD CONSTRAINT "planillas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_planilla_id_fkey" FOREIGN KEY ("planilla_id") REFERENCES "planillas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dotaciones_calculadas" ADD CONSTRAINT "dotaciones_calculadas_planilla_id_fkey" FOREIGN KEY ("planilla_id") REFERENCES "planillas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
