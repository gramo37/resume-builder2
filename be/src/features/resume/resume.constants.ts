export const VERSION_STATUSES = ['PROPOSED', 'APPROVED', 'REJECTED', 'SUPERSEDED'] as const;
export type VersionStatus = (typeof VERSION_STATUSES)[number];

export const VERSION_SOURCES = ['AI', 'EDITOR', 'SYSTEM', 'IMPORT'] as const;
export type VersionSource = (typeof VERSION_SOURCES)[number];

export const CHANGE_REQUEST_STATUSES = ['PROCESSING', 'PROPOSED', 'APPROVED', 'REJECTED', 'FAILED'] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const CHAT_ROLES = ['USER', 'ASSISTANT', 'SYSTEM'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const MAX_RETAINED_VERSIONS = 10;
