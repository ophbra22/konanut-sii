import {
  isCouncilScopedRole,
  isPlagaScopedRole,
  isSettlementScopedRole,
} from '@/src/features/auth/lib/permissions';
import type {
  AuthProfile,
  Settlement,
  Training,
  UserRole,
} from '@/src/types/database';

export type PermissionScope =
  | {
      role: UserRole | null;
      type: 'global';
    }
  | {
      assignedPlaga: string | null;
      role: UserRole | null;
      type: 'plaga';
    }
  | {
      regionalCouncils: string[];
      role: UserRole | null;
      type: 'regional_councils';
    }
  | {
      role: UserRole | null;
      settlementIds: string[];
      type: 'settlements';
    };

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export function getUserScope(profile: AuthProfile | null): PermissionScope {
  const role = profile?.role ?? null;

  if (isSettlementScopedRole(role)) {
    return {
      role,
      settlementIds: profile?.linkedSettlementIds ?? [],
      type: 'settlements',
    };
  }

  if (isCouncilScopedRole(role)) {
    return {
      regionalCouncils: profile?.linkedRegionalCouncils ?? [],
      role,
      type: 'regional_councils',
    };
  }

  if (isPlagaScopedRole(role)) {
    return {
      assignedPlaga: profile?.assigned_plaga ?? null,
      role,
      type: 'plaga',
    };
  }

  return {
    role,
    type: 'global',
  };
}

export function canUserSeeSettlement(
  profile: AuthProfile | null,
  settlement: Pick<Settlement, 'area' | 'id' | 'regional_council'> & {
    council?: { plaga_name: string | null } | null;
  }
) {
  const scope = getUserScope(profile);

  if (scope.type === 'global') {
    return true;
  }

  if (scope.type === 'settlements') {
    return scope.settlementIds.includes(settlement.id);
  }

  if (scope.type === 'regional_councils') {
    const allowedCouncils = new Set(scope.regionalCouncils.map(normalize));
    return allowedCouncils.has(normalize(settlement.regional_council));
  }

  const settlementPlaga = settlement.council?.plaga_name ?? settlement.area;
  return normalize(scope.assignedPlaga) === normalize(settlementPlaga);
}

export function canUserSeeTraining<
  T extends Pick<Training, 'instructor_id'> & {
    training_settlements?: Array<{
      settlement:
        | (Pick<Settlement, 'area' | 'id' | 'regional_council'> & {
            council?: { plaga_name: string | null } | null;
          })
        | null;
    }>;
  },
>(profile: AuthProfile | null, training: T) {
  if (!profile) {
    return false;
  }

  if (training.instructor_id === profile.id) {
    return true;
  }

  const scope = getUserScope(profile);

  if (scope.type === 'global') {
    return true;
  }

  return (training.training_settlements ?? []).some((link) =>
    link.settlement ? canUserSeeSettlement(profile, link.settlement) : false
  );
}

export function getRelevantUsersForTraining() {
  throw new Error(
    'getRelevantUsersForTraining is implemented server-side in the send-training-reminders Edge Function so scope checks cannot be bypassed by the client.'
  );
}
