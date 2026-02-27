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
