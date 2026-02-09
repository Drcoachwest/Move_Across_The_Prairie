// Curriculum resource type definitions and enums

export const SchoolBand = {
  ELEMENTARY: 'ELEMENTARY',
  MIDDLE: 'MIDDLE',
  HIGH: 'HIGH',
} as const;

export type SchoolBand = typeof SchoolBand[keyof typeof SchoolBand];

export const GradeGroup = {
  K_2: 'K-2',
  THREE_5: '3-5',
  SIX_8: '6-8',
  NINE_12: '9-12',
} as const;

export type GradeGroup = typeof GradeGroup[keyof typeof GradeGroup];

export const ResourceType = {
  PDF: 'pdf',
  DOC: 'doc',
  LINK: 'link',
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

// Validation helpers
export function isValidBand(value: string): value is SchoolBand {
  return Object.values(SchoolBand).includes(value as SchoolBand);
}

export function isValidGradeGroup(value: string): value is GradeGroup {
  return Object.values(GradeGroup).includes(value as GradeGroup);
}

export function isValidResourceType(value: string): value is ResourceType {
  return Object.values(ResourceType).includes(value as ResourceType);
}

// Display helpers
export function getBandLabel(band: SchoolBand): string {
  switch (band) {
    case SchoolBand.ELEMENTARY:
      return 'Elementary';
    case SchoolBand.MIDDLE:
      return 'Middle School';
    case SchoolBand.HIGH:
      return 'High School';
    default:
      return band;
  }
}

export const VALID_BANDS = Object.values(SchoolBand);
export const VALID_GRADE_GROUPS = Object.values(GradeGroup);
export const VALID_RESOURCE_TYPES = Object.values(ResourceType);
