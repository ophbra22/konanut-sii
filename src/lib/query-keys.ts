export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  dashboard: {
    overview: ['dashboard', 'overview'] as const,
  },
  rankings: {
    all: ['rankings'] as const,
    period: (period: string) => ['rankings', period] as const,
    periods: ['rankings', 'periods'] as const,
  },
  settlements: {
    all: ['settlements'] as const,
    detail: (settlementId: string) => ['settlements', settlementId] as const,
  },
  trainings: {
    all: ['trainings'] as const,
    detail: (trainingId: string) => ['trainings', trainingId] as const,
  },
} as const;
