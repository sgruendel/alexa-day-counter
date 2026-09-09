import { Count } from '../db.js';

const counts = new Map();
const originalQuery = Count.query;
const originalSave = Count.prototype.save;
const hadOwnSave = Object.hasOwn(Count.prototype, 'save');

function key(userId, date) {
    return `${userId}\0${date}`;
}

async function save() {
    const item = { userId: this.userId, date: this.date, count: this.count };
    counts.set(key(item.userId, item.date), item);
    return item;
}

// This fake intentionally supports only the condition shapes used by the handlers:
// userId.eq combined with date.eq or date.between.
const query = (conditions) => ({
    exec: async () => {
        const items = [...counts.values()]
            .filter((item) => {
                if (item.userId !== conditions.userId.eq) {
                    return false;
                }
                if (conditions.date.eq !== undefined) {
                    return item.date === conditions.date.eq;
                }
                const [fromDate, toDate] = conditions.date.between;
                return item.date >= fromDate && item.date <= toDate;
            })
            .sort((a, b) => a.date.localeCompare(b.date));
        return Object.assign(items, { count: items.length });
    },
});

export function resetCounts(items = []) {
    counts.clear();
    for (const item of items) {
        counts.set(key(item.userId, item.date), { ...item });
    }
}

before(() => {
    Count.prototype.save = save;
    Count.query = query;
});

beforeEach(() => {
    resetCounts();
});

after(() => {
    Count.query = originalQuery;
    if (hadOwnSave) {
        Count.prototype.save = originalSave;
    } else {
        delete Count.prototype.save;
    }
    counts.clear();
});
