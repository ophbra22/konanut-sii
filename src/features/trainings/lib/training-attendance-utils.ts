import type {
  Json,
  Settlement,
  TrainingParticipationSummary,
  TrainingSettlementAttendance,
} from '@/src/types/database';

type SelectableSettlement = Pick<Settlement, 'id' | 'name' | 'total_squad_members'>;

function isJsonObject(value: Json | null | undefined): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNonNegativeInteger(value: Json | null | undefined) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }

  return null;
}

function normalizeSettlementName(value: Json | null | undefined) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function calculateParticipationRate(
  trainedCount: number,
  totalSquadMembers: number | null
) {
  if (totalSquadMembers === null || totalSquadMembers <= 0) {
    return null;
  }

  return Math.round((trainedCount / totalSquadMembers) * 100);
}

export function buildSettlementAttendance(
  selectedSettlements: SelectableSettlement[]
): TrainingSettlementAttendance[] {
  return selectedSettlements.map((settlement) => ({
    participation_rate: null,
    settlement_id: settlement.id,
    settlement_name: settlement.name,
    total_squad_members_snapshot: settlement.total_squad_members,
    trained_count: 0,
  }));
}

export function normalizeTrainingSettlementAttendance(
  rawValue: Json | null | undefined
): TrainingSettlementAttendance[] {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  const seenSettlementIds = new Set<string>();

  return rawValue.reduce<TrainingSettlementAttendance[]>((items, value) => {
    if (!isJsonObject(value)) {
      return items;
    }

    const settlementId = normalizeSettlementName(value.settlement_id);
    const settlementName = normalizeSettlementName(value.settlement_name);
    const trainedCount = toNonNegativeInteger(value.trained_count);
    const totalSquadMembersSnapshot = toNonNegativeInteger(value.total_squad_members_snapshot);

    if (!settlementId || !settlementName || trainedCount === null || seenSettlementIds.has(settlementId)) {
      return items;
    }

    seenSettlementIds.add(settlementId);

    items.push({
      participation_rate: calculateParticipationRate(trainedCount, totalSquadMembersSnapshot),
      settlement_id: settlementId,
      settlement_name: settlementName,
      total_squad_members_snapshot: totalSquadMembersSnapshot,
      trained_count: trainedCount,
    });

    return items;
  }, []);
}

export function syncSettlementAttendance(
  selectedSettlements: SelectableSettlement[],
  existingAttendance: TrainingSettlementAttendance[]
): TrainingSettlementAttendance[] {
  const existingAttendanceBySettlementId = new Map(
    existingAttendance.map((item) => [item.settlement_id, item])
  );

  return selectedSettlements.map((settlement) => {
    const existingItem = existingAttendanceBySettlementId.get(settlement.id);

    if (!existingItem) {
      return {
        participation_rate: null,
        settlement_id: settlement.id,
        settlement_name: settlement.name,
        total_squad_members_snapshot: settlement.total_squad_members,
        trained_count: 0,
      };
    }

    return {
      participation_rate: calculateParticipationRate(
        existingItem.trained_count,
        existingItem.total_squad_members_snapshot
      ),
      settlement_id: existingItem.settlement_id,
      settlement_name: existingItem.settlement_name,
      total_squad_members_snapshot: existingItem.total_squad_members_snapshot,
      trained_count: existingItem.trained_count,
    };
  });
}

export function calculateTrainingParticipationSummary(
  attendance: TrainingSettlementAttendance[]
): TrainingParticipationSummary {
  const totalTrainedOverall = attendance.reduce(
    (sum, item) => sum + item.trained_count,
    0
  );
  const totalSquadOverall = attendance.reduce((sum, item) => {
    if (item.total_squad_members_snapshot === null) {
      return sum;
    }

    return sum + item.total_squad_members_snapshot;
  }, 0);

  return {
    overall_participation_rate:
      totalSquadOverall > 0
        ? Math.round((totalTrainedOverall / totalSquadOverall) * 100)
        : null,
    total_squad_overall: totalSquadOverall,
    total_trained_overall: totalTrainedOverall,
  };
}

export function isSameSettlementAttendance(
  left: TrainingSettlementAttendance[],
  right: TrainingSettlementAttendance[]
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((leftItem, index) => {
    const rightItem = right[index];

    return (
      leftItem.settlement_id === rightItem?.settlement_id &&
      leftItem.settlement_name === rightItem.settlement_name &&
      leftItem.trained_count === rightItem.trained_count &&
      leftItem.total_squad_members_snapshot === rightItem.total_squad_members_snapshot &&
      leftItem.participation_rate === rightItem.participation_rate
    );
  });
}
