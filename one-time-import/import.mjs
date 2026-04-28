import 'dotenv/config';
import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FILE_PATH = process.env.EXCEL_FILE || './training-status.xlsx';
const SHEET_NAME = process.env.SHEET_NAME || '2026';

function normalizeText(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeCouncil(value) {
    const text = normalizeText(value);
    return text.replace(/\s+\d+$/, '').trim();
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;

    const cleaned = String(value)
        .replace('%', '')
        .replace(',', '.')
        .trim();

    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}

function toBoolean(value) {
    if (value === null || value === undefined || value === '') return null;

    const v = String(value).trim().toLowerCase();

    if (['1', 'true', 'yes', 'כן', 'בוצע'].includes(v)) return true;
    if (['0', 'false', 'no', 'לא'].includes(v)) return false;

    return null;
}

function excelDateToISO(value) {
    if (!value) return null;

    if (value instanceof Date && !isNaN(value)) {
        return value.toISOString().split('T')[0];
    }

    if (typeof value === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const result = new Date(excelEpoch.getTime() + value * 86400000);
        return result.toISOString().split('T')[0];
    }

    const str = String(value).trim();

    const m = str.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
    if (m) {
        let [, d, mo, y] = m;
        if (y.length === 2) y = `20${y}`;
        const dt = new Date(`${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`);
        if (!isNaN(dt)) return dt.toISOString().split('T')[0];
    }

    const parsed = new Date(str);
    if (!isNaN(parsed)) {
        return parsed.toISOString().split('T')[0];
    }

    return null;
}

function buildAttendance(settlementId, registered, actual, percent) {
    return [
        {
            settlement_id: settlementId,
            registered_force: registered,
            actual_force: actual,
            participation_percent: percent,
        },
    ];
}

function readRowsFromExcel() {
    const workbook = xlsx.readFile(FILE_PATH, { cellDates: true });
    const sheet = workbook.Sheets[SHEET_NAME];

    if (!sheet) {
        throw new Error(`Sheet "${SHEET_NAME}" not found in ${FILE_PATH}`);
    }

    const rows = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: false,
    });

    const dataRows = rows.slice(2);

    let lastPlaga = null;
    let lastCouncil = null;

    return dataRows.map((r) => {
        const plaga = r[0] ? normalizeText(r[0]) : lastPlaga;
        const council = r[1] ? normalizeCouncil(r[1]) : lastCouncil;

        if (plaga) lastPlaga = plaga;
        if (council) lastCouncil = council;

        return {
            plaga,
            council,
            settlement: normalizeText(r[2]),

            rangeA_planned: r[3],
            rangeA_completed: r[4],
            rangeA_done: r[5],
            rangeA_registered: r[6],
            rangeA_actual: r[7],
            rangeA_percent: r[8],

            defense_planned: r[10],
            defense_completed: r[11],
            defense_done: r[12],
            defense_registered: r[13],
            defense_actual: r[14],
            defense_percent: r[15],
        };
    });
}

function buildTrainingBlocks(row) {
    return [
        {
            key: 'range_a',
            titlePrefix: 'מטווח חציון א',
            training_type: 'מטווח',
            planned: excelDateToISO(row.rangeA_planned),
            completed: excelDateToISO(row.rangeA_completed),
            done: toBoolean(row.rangeA_done),
            registered: toNumber(row.rangeA_registered),
            actual: toNumber(row.rangeA_actual),
            percent: toNumber(row.rangeA_percent),
        },
        {
            key: 'defense',
            titlePrefix: 'אימון הגנת יישוב',
            training_type: 'הגנת יישוב',
            planned: excelDateToISO(row.defense_planned),
            completed: excelDateToISO(row.defense_completed),
            done: toBoolean(row.defense_done),
            registered: toNumber(row.defense_registered),
            actual: toNumber(row.defense_actual),
            percent: toNumber(row.defense_percent),
        },
    ].filter((t) => {
        return (
            t.planned ||
            t.completed ||
            t.done !== null ||
            t.registered !== null ||
            t.actual !== null ||
            t.percent !== null
        );
    });
}

async function getOrCreateCouncil(councilName, plagaName, summary) {
    const name = normalizeCouncil(councilName);
    const plaga = normalizeText(plagaName);

    if (!name) return null;

    const { data: existing, error: findError } = await supabase
        .from('regional_councils')
        .select('id, name, plaga_name')
        .eq('name', name)
        .maybeSingle();

    if (findError) throw findError;

    if (existing) return existing;

    const payload = {
        name,
        plaga_name: plaga || 'פלגת לכיש',
    };

    const { data, error } = await supabase
        .from('regional_councils')
        .insert(payload)
        .select('id, name, plaga_name')
        .single();

    if (error) throw error;

    summary.councilsCreated += 1;
    return data;
}

async function getOrCreateSettlement(row, council, summary) {
    const settlementName = normalizeText(row.settlement);
    if (!settlementName) return null;

    const { data: existing, error: findError } = await supabase
        .from('settlements')
        .select('id, name, council_id')
        .eq('name', settlementName)
        .maybeSingle();

    if (findError) throw findError;

    if (existing) {
        summary.settlementsMatched += 1;

        if (!existing.council_id && council?.id) {
            const { error: updateError } = await supabase
                .from('settlements')
                .update({
                    regional_council: normalizeCouncil(row.council),
                    area: normalizeText(row.plaga) || 'לא משויך',
                    council_id: council.id,
                })
                .eq('id', existing.id);

            if (updateError) throw updateError;
        }

        return existing;
    }

    const payload = {
        name: settlementName,
        regional_council: normalizeCouncil(row.council),
        area: normalizeText(row.plaga) || 'לא משויך',
        council_id: council?.id || null,
    };

    const { data, error } = await supabase
        .from('settlements')
        .insert(payload)
        .select('id, name')
        .single();

    if (error) throw error;

    summary.settlementsCreated += 1;
    return data;
}

async function findExistingTraining(title, trainingDate, trainingType) {
    const { data, error } = await supabase
        .from('trainings')
        .select('id, title')
        .eq('title', title)
        .eq('training_date', trainingDate)
        .eq('training_type', trainingType)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function createTraining(settlement, block, summary) {
    const trainingDate = block.completed || block.planned;
    if (!trainingDate) return { training: null, existed: false };

    const status =
        block.completed || block.done === true ? 'הושלם' : 'מתוכנן';

    const title = `${block.titlePrefix} - ${settlement.name}`;

    const existing = await findExistingTraining(
        title,
        trainingDate,
        block.training_type
    );

    if (existing) {
        return { training: existing, existed: true };
    }

    const payload = {
        title,
        training_type: block.training_type,
        training_date: trainingDate,
        status,
        notes: 'יובא מקובץ אקסל',
        settlement_attendance: buildAttendance(
            settlement.id,
            block.registered,
            block.actual,
            block.percent
        ),
    };

    const { data, error } = await supabase
        .from('trainings')
        .insert(payload)
        .select('id, title')
        .single();

    if (error) throw error;

    summary.trainingsCreated += 1;
    return { training: data, existed: false };
}

async function ensureTrainingSettlementLink(trainingId, settlementId, summary) {
    const { data: existing, error: findError } = await supabase
        .from('training_settlements')
        .select('id')
        .eq('training_id', trainingId)
        .eq('settlement_id', settlementId)
        .maybeSingle();

    if (findError) throw findError;

    if (existing) return;

    const { error } = await supabase
        .from('training_settlements')
        .insert({
            training_id: trainingId,
            settlement_id: settlementId,
        });

    if (error) throw error;

    summary.linksCreated += 1;
}

async function run() {
    const rows = readRowsFromExcel();

    const summary = {
        rowsRead: rows.length,
        councilsCreated: 0,
        settlementsCreated: 0,
        settlementsMatched: 0,
        trainingsCreated: 0,
        linksCreated: 0,
        skippedRows: 0,
        errors: [],
    };

    for (const row of rows) {
        try {
            const settlementName = normalizeText(row.settlement);

            if (!settlementName) {
                summary.skippedRows += 1;
                continue;
            }

            const council = await getOrCreateCouncil(row.council, row.plaga, summary);
            const settlement = await getOrCreateSettlement(row, council, summary);

            if (!settlement) {
                summary.skippedRows += 1;
                continue;
            }

            const trainingBlocks = buildTrainingBlocks(row);

            for (const block of trainingBlocks) {
                const trainingDate = block.completed || block.planned;
                if (!trainingDate) continue;

                const { training } = await createTraining(settlement, block, summary);
                if (!training) continue;

                await ensureTrainingSettlementLink(training.id, settlement.id, summary);
            }
        } catch (error) {
            summary.errors.push(String(error.message || error));
        }
    }

    console.log('\n=== IMPORT SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
}

run().catch((err) => {
    console.error('FATAL ERROR');
    console.error(err);
    process.exit(1);
});