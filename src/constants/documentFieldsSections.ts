// ===================================================
// ORGANIZACIÓN DE CAMPOS POR SECCIONES
// ===================================================
// Campos organizados por anverso/reverso o páginas
// según el documento físico real
// ===================================================

export interface FieldSection {
  title: string;
  emoji: string;
  fields: string[];
}

// ===================================================
// DNI (Documento Nacional de Identidad)
// ===================================================
export const DNI_SECTIONS: FieldSection[] = [
  {
    title: 'Anverso',
    emoji: '🔵',
    fields: [
      'numero',
      'apellido1',
      'apellido2',
      'nombre',
      'sexo',
      'nacionalidad',
      'fechaNacimiento',
      'fechaCaducidad',
    ],
  },
  {
    title: 'Reverso',
    emoji: '🔴',
    fields: [
      'numeroSoporte',
      'idesp',
      'equipoExpedidor',
      'fechaExpedicion',
      'nombrePadre',
      'nombreMadre',
      'paisNacimiento',
      'provinciaNacimiento',
      'municipioNacimiento',
      'domicilio',
      'municipio',
      'provincia',
    ],
  },
];

// ===================================================
// NIE (Número de Identidad de Extranjero)
// ===================================================
export const NIE_SECTIONS: FieldSection[] = [
  {
    title: 'Anverso',
    emoji: '🔵',
    fields: [
      'numero',
      'apellido1',
      'apellido2',
      'nombre',
      'sexo',
      'nacionalidad',
      'fechaNacimiento',
      'fechaCaducidad',
    ],
  },
  {
    title: 'Reverso',
    emoji: '🔴',
    fields: [
      'numeroSoporte',
      'idesp',
      'equipoExpedidor',
      'fechaExpedicion',
      'nombrePadre',
      'nombreMadre',
      'paisNacimiento',
      'provinciaNacimiento',
      'municipioNacimiento',
      'domicilio',
      'municipio',
      'provincia',
    ],
  },
];

// ===================================================
// TIE (Tarjeta de Identidad de Extranjero)
// ===================================================
export const TIE_SECTIONS: FieldSection[] = [
  {
    title: 'Anverso',
    emoji: '🔵',
    fields: [
      'numero',
      'apellido1',
      'apellido2',
      'nombre',
      'sexo',
      'nacionalidad',
      'fechaNacimiento',
      'tipoAutorizacion',
      'fechaCaducidad',
    ],
  },
  {
    title: 'Reverso',
    emoji: '🔴',
    fields: [
      'numeroSoporte',
      'idesp',
      'equipoExpedidor',
      'fechaExpedicion',
      'fechaInicioAutorizacion',
      'fechaFinAutorizacion',
      'nombrePadre',
      'nombreMadre',
      'paisNacimiento',
      'provinciaNacimiento',
      'municipioNacimiento',
      'domicilio',
      'municipio',
      'provincia',
    ],
  },
];

// ===================================================
// PASAPORTE
// ===================================================
export const PASSPORT_SECTIONS: FieldSection[] = [
  {
    title: 'Página de Datos',
    emoji: '📄',
    fields: [
      'tipo',
      'codigoPais',
      'numero',
      'apellidos',
      'nombres',
      'nacionalidad',
      'fechaNacimiento',
      'sexo',
      'lugarNacimiento',
      'fechaExpedicion',
      'autoridadExpedidora',
      'fechaCaducidad',
    ],
  },
  {
    title: 'MRZ / Observaciones',
    emoji: '🔍',
    fields: [
      'lineaMRZ',
      'observaciones',
    ],
  },
];

// ===================================================
// HELPER: Obtener secciones según tipo
// ===================================================
export function getSectionsForDocumentType(type: string): FieldSection[] | null {
  switch (type) {
    case 'DNI':
      return DNI_SECTIONS;
    case 'NIE':
      return NIE_SECTIONS;
    case 'TIE':
      return TIE_SECTIONS;
    case 'passport':
      return PASSPORT_SECTIONS;
    default:
      return null;
  }
}

// ===================================================
// LABELS LEGIBLES PARA CAMPOS
// ===================================================
export const FIELD_LABELS: Record<string, string> = {
  // DNI/NIE/TIE
  numero: 'Número',
  apellido1: 'Primer Apellido',
  apellido2: 'Segundo Apellido',
  nombre: 'Nombre(s)',
  sexo: 'Sexo',
  nacionalidad: 'Nacionalidad',
  fechaNacimiento: 'Fecha de Nacimiento',
  fechaCaducidad: 'Fecha de Caducidad',
  numeroSoporte: 'Número de Soporte',
  idesp: 'IDESP',
  equipoExpedidor: 'Equipo Expedidor',
  fechaExpedicion: 'Fecha de Expedición',
  nombrePadre: 'Nombre del Padre',
  nombreMadre: 'Nombre de la Madre',
  paisNacimiento: 'País de Nacimiento',
  provinciaNacimiento: 'Provincia de Nacimiento',
  municipioNacimiento: 'Municipio de Nacimiento',
  domicilio: 'Domicilio',
  municipio: 'Municipio',
  provincia: 'Provincia',
  tipoAutorizacion: 'Tipo de Autorización',
  fechaInicioAutorizacion: 'Inicio Autorización',
  fechaFinAutorizacion: 'Fin Autorización',
  
  // Pasaporte
  tipo: 'Tipo',
  codigoPais: 'Código País',
  apellidos: 'Apellidos',
  nombres: 'Nombres',
  lugarNacimiento: 'Lugar de Nacimiento',
  autoridadExpedidora: 'Autoridad Expedidora',
  lineaMRZ: 'Línea MRZ',
  observaciones: 'Observaciones',
};

