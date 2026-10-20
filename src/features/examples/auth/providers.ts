// Porté depuis ui-kit Angular (examples/auth/provider-icon.component.ts).
export type AuthProvider = 'google' | 'apple' | 'microsoft' | 'facebook' | 'github' | 'linkedin';

export const PROVIDERS: Record<AuthProvider, { label: string; brand: string }> = {
  google: { label: 'Google', brand: '#ffffff' },
  apple: { label: 'Apple', brand: '#000000' },
  microsoft: { label: 'Microsoft', brand: '#2f2f2f' },
  facebook: { label: 'Facebook', brand: '#1877f2' },
  github: { label: 'GitHub', brand: '#24292f' },
  linkedin: { label: 'LinkedIn', brand: '#0a66c2' },
};
