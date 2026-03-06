export interface Ticket {
  ID: number;
  Cliente: string;
  Título: string;
  Tipo: string;
  Autor: string;
  Asignado: string;
  Prioridad: string;
  Estado: string;
  Creación: string;
  Modificación: string;
}

export const HEADER_ROW_INDEX = 2; // Fila 3 en Excel (0-based = 2)

export interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  responsable: string;
  prioridad: string;
  estado: string;
  fechaCreacion: string;
  fechaVencimiento: string | null;
}

/** Cliente (ej. Banco): datos de contrato y contacto. Extensible con más campos después. */
export interface Client {
  id: number;
  nombre: string;
  producto: string;
  fechaContratoInicio: string | null;
  fechaContratoFin: string | null;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  notas: string;
}
