export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  settlements: {
    all: ['settlements'] as const,
    detail: (settlementId: string) => ['settlements', settlementId] as const,
  },
  trainings: {
    all: ['trainings'] as const,
  },
} as const;
