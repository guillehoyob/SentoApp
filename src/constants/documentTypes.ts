// ===================================================
// TIPOS Y PLANTILLAS DE DOCUMENTOS
// ===================================================

export type DocumentCategory = 'identity_card' | 'passport' | 'other';
export type IdentityCardSubtype = 'DNI' | 'NIE' | 'TIE';
export type OtherDocType = 'health' | 'driving' | 'financial' | 'education' | 'professional' | 'travel' | 'legal' | 'property' | 'identification' | 'other';

export interface DocumentField {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'date' | 'select' | 'number';
  format?: string; // Hint de formato
  options?: string[]; // Para selects
  maxLength?: number;
  placeholder?: string;
}

// ===================================================
// A. TARJETAS DE IDENTIDAD
// ===================================================

export const DNI_FIELDS: DocumentField[] = [
  { key: 'numero', label: 'Número DNI', required: true, type: 'text', format: '12345678A', maxLength: 9 },
  { key: 'apellido1', label: 'Primer Apellido', required: true, type: 'text' },
  { key: 'apellido2', label: 'Segundo Apellido', required: false, type: 'text' },
  { key: 'nombre', label: 'Nombre(s)', required: true, type: 'text' },
  { key: 'sexo', label: 'Sexo', required: true, type: 'select', options: ['M', 'F'] },
  { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', required: true, type: 'date' },
  { key: 'nacionalidad', label: 'Nacionalidad', required: true, type: 'text', placeholder: 'ESP' },
  { key: 'numeroSoporte', label: 'Número de Soporte', required: true, type: 'text', format: 'ABC123456', maxLength: 9 },
  { key: 'fechaExpedicion', label: 'Fecha de Expedición', required: true, type: 'date' },
  { key: 'fechaCaducidad', label: 'Fecha de Caducidad', required: true, type: 'date' },
  { key: 'equipoExpedidor', label: 'Equipo Expedidor', required: true, type: 'text' },
  { key: 'idesp', label: 'IDESP', required: true, type: 'text', format: 'ABC123456' },
  { key: 'nombrePadre', label: 'Nombre del Padre', required: false, type: 'text' },
  { key: 'nombreMadre', label: 'Nombre de la Madre', required: false, type: 'text' },
  { key: 'domicilio', label: 'Domicilio Completo', required: true, type: 'text' },
  { key: 'municipio', label: 'Municipio', required: true, type: 'text' },
  { key: 'provincia', label: 'Provincia', required: true, type: 'text' },
  { key: 'paisNacimiento', label: 'País de Nacimiento', required: true, type: 'text' },
  { key: 'provinciaNacimiento', label: 'Provincia de Nacimiento', required: true, type: 'text' },
  { key: 'municipioNacimiento', label: 'Municipio de Nacimiento', required: true, type: 'text' },
];

export const NIE_FIELDS: DocumentField[] = [
  { key: 'numero', label: 'Número NIE', required: true, type: 'text', format: 'X1234567A', maxLength: 9 },
  { key: 'apellido1', label: 'Primer Apellido', required: true, type: 'text' },
  { key: 'apellido2', label: 'Segundo Apellido', required: false, type: 'text' },
  { key: 'nombre', label: 'Nombre(s)', required: true, type: 'text' },
  { key: 'sexo', label: 'Sexo', required: true, type: 'select', options: ['M', 'F'] },
  { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', required: true, type: 'date' },
  { key: 'nacionalidad', label: 'Nacionalidad', required: true, type: 'text', placeholder: 'Ej: MARRUECOS' },
  { key: 'numeroSoporte', label: 'Número de Soporte', required: true, type: 'text', format: 'ABC123456', maxLength: 9 },
  { key: 'fechaExpedicion', label: 'Fecha de Expedición', required: true, type: 'date' },
  { key: 'fechaCaducidad', label: 'Fecha de Caducidad', required: true, type: 'date' },
  { key: 'equipoExpedidor', label: 'Equipo Expedidor', required: true, type: 'text' },
  { key: 'idesp', label: 'IDESP', required: true, type: 'text', format: 'ABC123456' },
  { key: 'nombrePadre', label: 'Nombre del Padre', required: false, type: 'text' },
  { key: 'nombreMadre', label: 'Nombre de la Madre', required: false, type: 'text' },
  { key: 'domicilio', label: 'Domicilio en España', required: true, type: 'text' },
  { key: 'municipio', label: 'Municipio', required: true, type: 'text' },
  { key: 'provincia', label: 'Provincia', required: true, type: 'text' },
  { key: 'paisNacimiento', label: 'País de Nacimiento', required: true, type: 'text' },
  { key: 'provinciaNacimiento', label: 'Provincia de Nacimiento', required: true, type: 'text' },
  { key: 'municipioNacimiento', label: 'Municipio de Nacimiento', required: true, type: 'text' },
];

export const TIE_FIELDS: DocumentField[] = [
  { key: 'numero', label: 'Número NIE (en TIE)', required: true, type: 'text', format: 'X1234567A', maxLength: 9 },
  { key: 'apellido1', label: 'Primer Apellido', required: true, type: 'text' },
  { key: 'apellido2', label: 'Segundo Apellido', required: false, type: 'text' },
  { key: 'nombre', label: 'Nombre(s)', required: true, type: 'text' },
  { key: 'sexo', label: 'Sexo', required: true, type: 'select', options: ['M', 'F'] },
  { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', required: true, type: 'date' },
  { key: 'nacionalidad', label: 'Nacionalidad', required: true, type: 'text' },
  { key: 'numeroSoporte', label: 'Número de Soporte', required: true, type: 'text', format: 'ABC123456', maxLength: 9 },
  { key: 'tipoAutorizacion', label: 'Tipo de Autorización', required: true, type: 'text', placeholder: 'Ej: Residencia temporal' },
  { key: 'fechaExpedicion', label: 'Fecha de Expedición', required: true, type: 'date' },
  { key: 'fechaCaducidad', label: 'Fecha de Caducidad', required: true, type: 'date' },
  { key: 'equipoExpedidor', label: 'Equipo Expedidor', required: true, type: 'text' },
  { key: 'idesp', label: 'IDESP', required: true, type: 'text', format: 'ABC123456' },
  { key: 'nombrePadre', label: 'Nombre del Padre', required: false, type: 'text' },
  { key: 'nombreMadre', label: 'Nombre de la Madre', required: false, type: 'text' },
  { key: 'domicilio', label: 'Domicilio en España', required: true, type: 'text' },
  { key: 'municipio', label: 'Municipio', required: true, type: 'text' },
  { key: 'provincia', label: 'Provincia', required: true, type: 'text' },
  { key: 'paisNacimiento', label: 'País de Nacimiento', required: true, type: 'text' },
  { key: 'provinciaNacimiento', label: 'Provincia de Nacimiento', required: true, type: 'text' },
  { key: 'municipioNacimiento', label: 'Municipio de Nacimiento', required: true, type: 'text' },
  { key: 'fechaInicioAutorizacion', label: 'Fecha Inicio Autorización', required: true, type: 'date' },
  { key: 'fechaFinAutorizacion', label: 'Fecha Fin Autorización', required: true, type: 'date' },
];

// ===================================================
// B. PASAPORTE
// ===================================================

export const PASSPORT_FIELDS: DocumentField[] = [
  { key: 'tipo', label: 'Tipo', required: true, type: 'text', placeholder: 'P' },
  { key: 'codigoPais', label: 'Código País Emisor', required: true, type: 'text', placeholder: 'ESP', maxLength: 3 },
  { key: 'numero', label: 'Número de Pasaporte', required: true, type: 'text', format: 'ABC123456', maxLength: 9 },
  { key: 'apellidos', label: 'Apellidos Completos', required: true, type: 'text' },
  { key: 'nombres', label: 'Nombres Completos', required: true, type: 'text' },
  { key: 'nacionalidad', label: 'Nacionalidad', required: true, type: 'text', placeholder: 'ESP', maxLength: 3 },
  { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', required: true, type: 'date' },
  { key: 'sexo', label: 'Sexo', required: true, type: 'select', options: ['M', 'F'] },
  { key: 'lugarNacimiento', label: 'Lugar de Nacimiento', required: true, type: 'text', placeholder: 'Ciudad, Provincia, País' },
  { key: 'fechaExpedicion', label: 'Fecha de Expedición', required: true, type: 'date' },
  { key: 'autoridadExpedidora', label: 'Autoridad Expedidora', required: true, type: 'text', placeholder: 'Policía Nacional' },
  { key: 'fechaCaducidad', label: 'Fecha de Caducidad', required: true, type: 'date' },
  { key: 'lineaMRZ', label: 'Línea MRZ', required: false, type: 'text', placeholder: '2 líneas, 44 caracteres cada una' },
  { key: 'observaciones', label: 'Observaciones', required: false, type: 'text' },
];

// ===================================================
// C. OTROS DOCUMENTOS - CATEGORÍAS
// ===================================================

export const OTHER_DOCUMENT_CATEGORIES: { value: OtherDocType; label: string; emoji: string }[] = [
  { value: 'health', label: 'Salud', emoji: '🏥' },
  { value: 'driving', label: 'Conducción', emoji: '🚗' },
  { value: 'financial', label: 'Financiero', emoji: '💳' },
  { value: 'education', label: 'Educación', emoji: '🎓' },
  { value: 'professional', label: 'Profesional', emoji: '💼' },
  { value: 'travel', label: 'Viajes', emoji: '✈️' },
  { value: 'legal', label: 'Legal', emoji: '⚖️' },
  { value: 'property', label: 'Propiedad', emoji: '🏠' },
  { value: 'identification', label: 'Identificación', emoji: '🆔' },
  { value: 'other', label: 'Otro', emoji: '📄' },
];

// ===================================================
// HELPER: Obtener campos según tipo de documento
// ===================================================

export function getFieldsForDocumentType(
  category: DocumentCategory,
  subtype?: IdentityCardSubtype
): DocumentField[] {
  if (category === 'identity_card') {
    switch (subtype) {
      case 'DNI': return DNI_FIELDS;
      case 'NIE': return NIE_FIELDS;
      case 'TIE': return TIE_FIELDS;
      default: return [];
    }
  }
  
  if (category === 'passport') {
    return PASSPORT_FIELDS;
  }
  
  // "other" no tiene campos predefinidos - usa custom fields
  return [];
}

export function getDocumentTypeLabel(category: DocumentCategory, subtype?: string): string {
  if (category === 'identity_card') {
    return subtype || 'Tarjeta de Identidad';
  }
  if (category === 'passport') {
    return 'Pasaporte';
  }
  return 'Otro Documento';
}

