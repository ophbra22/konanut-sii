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

function getStatusByDate(trainingDate) {
    if (!trainingDate) return 'מתוכנן';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateObj = new Date(trainingDate);
    dateObj.setHours(0, 0, 0, 0);

    return dateObj <= today ? 'הושלם' : 'מתוכנן';
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
            rangeA_registered: r[6], // סד"כ רשום
            rangeA_actual: r[7],     // סד"כ מבצע
            rangeA_percent: r[8],

            defense_planned: r[10],
            defense_completed: r[11],
            defense_registered: r[13], // סד"כ רשום
            defense_actual: r[14],     // סד"כ מבצע
            defense_percent: r[15],
        };
    });
}

function buildTrainingBlocks(row) {
    return [
        {
            titlePrefix: 'מטווח חציון א',
            training_type: 'מטווח',
            training_date: excelDateToISO(row.rangeA_completed) || excelDateToISO(row.rangeA_planned),
            registered: toNumber(row.rangeA_registered),
            actual: toNumber(row.rangeA_actual),
            percent: toNumber(row.rangeA_percent),
        },
        {
            titlePrefix: 'אימון הגנת יישוב',
            training_type: 'הגנת יישוב',
            training_date: excelDateToISO(row.defense_completed) || excelDateToISO(row.defense_planned),
            registered: toNumber(row.defense_registered),
            actual: toNumber(row.defense_actual),
            percent: toNumber(row.defense_percent),
        },
    ].filter((t) => t.training_date);
}

async function findSettlementByName(name) {
    const { data, error } = await supabase
        .from('settlements')
        .select('id, name, total_squad_members')
        .eq('name', name)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function updateSettlementSquadMembers(settlementId, registered, summary) {
    if (registered === null || registered === undefined) return;

    const { error } = await supabase
        .from('settlements')
        .update({
            total_squad_members: registered,
        })
        .eq('id', settlementId);

    if (error) throw error;
    summary.settlementsUpdated += 1;
}

async function findImportedTraining(title, trainingDate, trainingType) {
    const { data, error } = await supabase
        .from('trainings')
        .select('id, title, training_date, status, settlement_attendance')
        .eq('title', title)
        .eq('training_date', trainingDate)
        .eq('training_type', trainingType)
        .eq('notes', 'יובא מקובץ אקסל')
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function updateTraining(trainingId, settlementId, trainingDate, registered, actual, percent, summary) {
    const status = getStatusByDate(trainingDate);
    const settlement_attendance = buildAttendance(settlementId, registered, actual, percent);

    const { error } = await supabase
        .from('trainings')
        .update({
            status,
            settlement_attendance,
        })
        .eq('id', trainingId);

    if (error) throw error;
    summary.trainingsUpdated += 1;
}

async function run() {
    const rows = readRowsFromExcel();

    const summary = {
        rowsRead: rows.length,
        settlementsUpdated: 0,
        trainingsUpdated: 0,
        missingSettlements: [],
        missingTrainings: [],
        errors: [],
    };

    for (const row of rows) {
        try {
            const settlementName = normalizeText(row.settlement);
            if (!settlementName) continue;

            const settlement = await findSettlementByName(settlementName);

            if (!settlement) {
                summary.missingSettlements.push(settlementName);
                continue;
            }

            const blocks = buildTrainingBlocks(row);

            for (const block of blocks) {
                const title = `${block.titlePrefix} - ${settlement.name}`;

                // 1) מצבת כיתת כוננות ליישוב = סד"כ רשום
                if (block.registered !== null) {
                    await updateSettlementSquadMembers(
                        settlement.id,
                        block.registered,
                        summary
                    );
                }

                // 2) attendance + status לאימון
                const training = await findImportedTraining(
                    title,
                    block.training_date,
                    block.training_type
                );

                if (!training) {
                    summary.missingTrainings.push({
                        settlement: settlement.name,
                        title,
                        training_date: block.training_date,
                    });
                    continue;
                }

                await updateTraining(
                    training.id,
                    settlement.id,
                    block.training_date,
                    block.registered,
                    block.actual,
                    block.percent,
                    summary
                );
            }
        } catch (error) {
            summary.errors.push(String(error.message || error));
        }
    }

    console.log('\n=== FIX SUMMARY ===');
    console.log(JSON.stringify(summary, null, 2));
}

run().catch((err) => {
    console.error('FATAL ERROR');
    console.error(err);
    process.exit(1);
});