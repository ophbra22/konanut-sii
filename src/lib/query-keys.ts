export const queryKeys = {
  auth: {
    activeProfiles: ['auth', 'active-profiles'] as const,
    deletionRequestedUsers: ['auth', 'deletion-requested-users'] as const,
    managedUsers: ['auth', 'managed-users'] as const,
    pendingUsers: ['auth', 'pending-users'] as const,
    profile: ['auth', 'profile'] as const,
  },
  calendar: {
    all: ['calendar'] as const,
    month: (monthKey: string) => ['calendar', monthKey] as const,
  },
  dashboard: {
    overview: ['dashboard', 'overview'] as const,
  },
  professionalContent: {
    all: ['professional-content'] as const,
    detail: (contentId: string) => ['professional-content', contentId] as const,
    list: (scope: 'active' | 'all') => ['professional-content', scope] as const,
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
