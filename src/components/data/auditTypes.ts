export type AuditAction = 'create' | 'update' | 'delete' | 'status' | 'comment' | 'login' | 'export';
export interface AuditChange {
  field: string;
  label?: string;
  before?: unknown;
  after?: unknown;
}
export interface AuditEntry {
  id: string;
  at: string | Date;
  user: { name: string; initials?: string; color?: string };
  action: AuditAction;
  /** Objet concerné (« Client CLI-1043 »). */
  target?: string;
  changes?: AuditChange[];
  comment?: string;
  /** Contexte technique (IP, appareil). */
  meta?: string;
}
