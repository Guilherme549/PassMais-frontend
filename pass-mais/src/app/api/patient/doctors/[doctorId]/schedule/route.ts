import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const schedules = {
  "481da316-353b-40ce-86c9-557971cf3798": {
    doctorId: "481da316-353b-40ce-86c9-557971cf3798",
    doctorName: "Marcelo Kauê das Neves",
    doctorSpecialty: "Ortopedia",
    doctorCrm: "345212",
    timezone: "America/Sao_Paulo",
    startDate: "2025-09-30",
    endDate: "2025-10-06",
    days: [
      {
        isoDate: "2025-09-30",
        label: "terça-feira, 30/09",
        source: "specific",
        slots: ["08:00", "08:40", "09:20", "10:00"],
        blocked: false,
      },
      {
        isoDate: "2025-10-01",
        label: "quarta-feira, 01/10",
        source: "specific",
        slots: ["08:00", "08:40", "09:20", "10:00", "10:40", "11:20"],
        blocked: false,
      },
      {
        isoDate: "2025-10-02",
        label: "quinta-feira, 02/10",
        source: "recurring",
        slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00"],
        blocked: false,
      },
      {
        isoDate: "2025-10-03",
        label: "sexta-feira, 03/10",
        source: "recurring",
        slots: [],
        blocked: true,
      },
      {
        isoDate: "2025-10-04",
        label: "sábado, 04/10",
        source: "recurring",
        slots: ["08:00", "08:30", "09:00"],
        blocked: false,
      },
      {
        isoDate: "2025-10-05",
        label: "domingo, 05/10",
        source: "none",
        slots: [],
        blocked: true,
      },
      {
        isoDate: "2025-10-06",
        label: "segunda-feira, 06/10",
        source: "recurring",
        slots: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00"],
        blocked: false,
      },
    ],
  },
  "121f48a9-00d4-4dae-a21a-b1f89d882cfe": {
    doctorId: "121f48a9-00d4-4dae-a21a-b1f89d882cfe",
    doctorName: "Dra. Maria Oliveira",
    doctorSpecialty: "Dermatologia",
    doctorCrm: "998877",
    timezone: "America/Sao_Paulo",
    startDate: "2025-10-10",
    endDate: "2025-10-16",
    days: [
      {
        isoDate: "2025-10-10",
        label: "sexta-feira, 10/10",
        source: "specific",
        slots: ["09:00", "09:20", "09:40", "10:00"],
        blocked: false,
      },
      {
        isoDate: "2025-10-11",
        label: "sábado, 11/10",
        source: "recurring",
        slots: ["08:00", "08:30", "09:00"],
        blocked: false,
      },
      {
        isoDate: "2025-10-12",
        label: "domingo, 12/10",
        source: "none",
        slots: [],
        blocked: true,
      },
      {
        isoDate: "2025-10-13",
        label: "segunda-feira, 13/10",
        source: "recurring",
        slots: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
        blocked: false,
      },
      {
        isoDate: "2025-10-14",
        label: "terça-feira, 14/10",
        source: "recurring",
        slots: [],
        blocked: false,
      },
      {
        isoDate: "2025-10-15",
        label: "quarta-feira, 15/10",
        source: "recurring",
        slots: ["13:00", "13:30", "14:00", "14:30", "15:00"],
        blocked: false,
      },
      {
        isoDate: "2025-10-16",
        label: "quinta-feira, 16/10",
        source: "recurring",
        slots: [],
        blocked: true,
      },
    ],
  },
} satisfies Record<string, any>;

async function getDoctorId(context: { params: Promise<{ doctorId: string }> }) {
  const params = await context.params;
  return params.doctorId;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ doctorId: string }> }) {
  const doctorId = await getDoctorId(context);
  const schedule = schedules[doctorId];

  if (!schedule) {
    return NextResponse.json(
      { status: "error", code: "SCHEDULE_NOT_FOUND", message: "Agenda não encontrada para o médico informado." },
      { status: 404 }
    );
  }

  return NextResponse.json(schedule, { status: 200 });
}
