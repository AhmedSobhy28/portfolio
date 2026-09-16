// The Ledger — real CSV-driven small-business analytics.
// Upload a transactions CSV (or load the bundled sample dataset) and every
// KPI, chart, and table row below is computed live from that data — nothing
// on screen after load is hand-typed.

Chart.defaults.font.family = "'Jost', sans-serif";
Chart.defaults.color = '#A89B7A';
Chart.defaults.borderColor = 'rgba(201, 162, 39, 0.14)';

const ink = '#EDE3C8', forest = '#C9A227', brick = '#B5473F', gold = '#E8C25C';
const catPalette = ['#C9A227', '#7FA88A', '#B5473F', '#8C7853', '#5C8A8A', '#E8C25C'];

const REQUIRED = ["id", "customer", "amount", "date"];
const COLUMN_ALIASES = {
    id: ["order", "order_id", "id", "orderid", "invoice"],
    customer: ["customer", "customer_name", "name", "client"],
    amount: ["amount", "total", "revenue", "value", "price"],
    date: ["date", "order_date", "created_at", "timestamp"],
    method: ["method", "payment", "payment_method", "paymentmethod"],
    category: ["category", "type", "product_category"],
    status: ["status", "fulfillment", "fulfilled", "state"],
};
const FULFILLED_WORDS = ["fulfilled", "completed", "delivered", "paid", "yes", "done", "shipped"];

let allData = [];
let filteredData = [];
let sortState = { key: "date", dir: "desc" };
let visibleCount = 25;
const PAGE_SIZE = 25;
let charts = {};
let lastSourceName = null;
let expandedUids = new Set(); // invoice rows currently showing their line-item breakdown
const STORAGE_KEY = "ledger-data-v1";
const STORAGE_SOURCE_KEY = "ledger-source-v1";

function makeUid() {
    return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Escapes user-controlled text before it's placed inside innerHTML template
// strings (customer names, categories, item descriptions all come from
// uploaded CSVs, manual entry, or imported backups — never trust them raw).
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str ?? "");
    return div.innerHTML;
}

// Wraps a CSV field for safe round-tripping: quotes it and doubles any
// internal quotes whenever it contains a comma, quote, or newline.
function csvField(value) {
    const s = String(value ?? "");
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

// ---------- Invoices & line items ----------
// A "row" in allData is an invoice: shared customer/date/method/status,
// plus one or more line items (each with its own description, category,
// quantity, and unit price). row.amount and row.category are cached
// summaries kept in sync via syncInvoiceCalc() whenever items change.

function makeItem(partial) {
    return {
        _iid: makeUid(),
        description: "",
        category: "Other",
        quantity: 1,
        unitPrice: 0,
        ...partial,
    };
}

function lineTotal(item) {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    return (isFinite(qty) ? qty : 0) * (isFinite(price) ? price : 0);
}

function invoiceTotal(row) {
    return (row.items || []).reduce((s, it) => s + lineTotal(it), 0);
}

function invoiceCategories(row) {
    return [...new Set((row.items || []).map(it => it.category || "Other"))];
}

function invoiceCategoryLabel(row) {
    const cats = invoiceCategories(row);
    if (!cats.length) return "Other";
    return cats.length > 1 ? `${cats[0]} +${cats.length - 1}` : cats[0];
}

function syncInvoiceCalc(row) {
    row.amount = Math.round(invoiceTotal(row) * 100) / 100;
    row.category = invoiceCategoryLabel(row);
    return row;
}

// ---------- Column mapping & parsing ----------

function mapHeaders(fields) {
    const map = {};
    const lowerFields = fields.map(f => f.trim().toLowerCase());
    for (const key in COLUMN_ALIASES) {
        for (const alias of COLUMN_ALIASES[key]) {
            const idx = lowerFields.indexOf(alias);
            if (idx !== -1) { map[key] = fields[idx]; break; }
        }
    }
    return map;
}

// Parses one flat CSV row into a "line" — not yet grouped into an invoice.
function normalizeCsvLine(raw, map, index) {
    const amountRaw = String(raw[map.amount] ?? "").replace(/[^0-9.\-]/g, "");
    const amount = parseFloat(amountRaw);
    const dateVal = new Date(raw[map.date]);
    const statusRaw = String(raw[map.status] ?? "fulfilled").trim().toLowerCase();
    return {
        id: String(raw[map.id] ?? `#${1000 + index}`).trim(),
        customer: String(raw[map.customer] ?? "Unknown").trim(),
        amount: isNaN(amount) ? 0 : amount,
        date: isNaN(dateVal.getTime()) ? null : dateVal,
        method: (raw[map.method] ? String(raw[map.method]).trim().toLowerCase() : "card"),
        category: (raw[map.category] ? String(raw[map.category]).trim() : "Other"),
        status: FULFILLED_WORDS.includes(statusRaw) ? "fulfilled" : "pending",
    };
}

// Groups flat CSV lines that share the same order/invoice number into a
// single invoice with multiple line items. A CSV with a unique id per row
// behaves exactly as before (one item per invoice); repeating the same id
// across rows combines them under one customer/invoice.
function groupLinesIntoInvoices(lines) {
    const map = new Map();
    const order = [];
    lines.forEach(line => {
        if (!map.has(line.id)) {
            map.set(line.id, {
                id: line.id,
                customer: line.customer,
                date: line.date,
                method: line.method,
                status: line.status,
                items: [],
                _uid: makeUid(),
            });
            order.push(line.id);
        }
        const inv = map.get(line.id);
        if (line.date && (!inv.date || line.date < inv.date)) inv.date = line.date;
        if (line.status === "pending") inv.status = "pending";
        inv.items.push(makeItem({
            description: line.category || line.customer || "Item",
            category: line.category || "Other",
            quantity: 1,
            unitPrice: line.amount,
        }));
    });
    return order.map(id => syncInvoiceCalc(map.get(id)));
}

function parseCSVFile(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
            if (!res.data.length || !res.meta.fields) {
                showError(t("errEmpty")); return;
            }
            const map = mapHeaders(res.meta.fields);
            const missing = REQUIRED.filter(k => !map[k]);
            if (missing.length) { showError(t("errColumns", missing)); return; }
            const lines = res.data
                .map((r, i) => normalizeCsvLine(r, map, i))
                .filter(r => r.date && !isNaN(r.amount));
            if (!lines.length) { showError(t("errEmpty")); return; }
            const rows = groupLinesIntoInvoices(lines);
            loadDataset(rows, file.name);
            addActivityLine(t("actUploaded", rows.length, lines.length));
        },
        error: () => showError(t("errParse")),
    });
}

function showError(msg) {
    alert(msg);
}

// ---------- Sample data generator (deterministic pseudo-random) ----------

function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function generateSampleData(n = 140) {
    const rand = mulberry32(42);
    const customers = ["Sara M.","Karim H.","Layla F.","Omar T.","Nour A.","Yassin K.","Hana S.","Mostafa R.",
        "Dina E.","Adam W.","Farida Z.","Sherif B.","Mona Y.","Tarek G.","Rana I.","Ziad N.",
        "Salma Q.","Hassan P.","Amira C.","Youssef D."];
    const categories = ["Retail","Wholesale","Services","Subscriptions","Other"];
    const methods = ["card","transfer","cash"];
    const start = new Date("2026-01-05");
    const rows = [];
    for (let i = 0; i < n; i++) {
        const dayOffset = Math.floor(rand() * 235); // ~ 8 months
        const date = new Date(start.getTime() + dayOffset * 86400000);
        // gentle upward growth trend over the period
        const growth = 1 + (dayOffset / 235) * 0.9;
        // most invoices have a single line item; roughly a quarter carry
        // two or three items (e.g. a customer ordering across categories)
        const itemCount = rand() < 0.75 ? 1 : (rand() < 0.65 ? 2 : 3);
        const items = [];
        for (let j = 0; j < itemCount; j++) {
            const category = categories[Math.floor(rand() * categories.length)];
            const baseAmount = { Retail: 60, Wholesale: 420, Services: 150, Subscriptions: 35, Other: 90 }[category];
            const qty = category === "Wholesale" ? 1 + Math.floor(rand() * 4) : 1;
            const unitPrice = Math.round(baseAmount * (0.4 + rand() * 1.8) * growth * 100) / 100;
            items.push(makeItem({
                description: itemCount > 1 ? `${category} item ${j + 1}` : category,
                category,
                quantity: qty,
                unitPrice,
            }));
        }
        const row = {
            id: `#${1000 + i}`,
            customer: customers[Math.floor(rand() * customers.length)],
            date,
            method: methods[Math.floor(rand() * methods.length)],
            status: rand() < 0.91 ? "fulfilled" : "pending",
            items,
            _uid: makeUid(),
        };
        rows.push(syncInvoiceCalc(row));
    }
    return rows.sort((a, b) => b.date - a.date);
}

// ---------- Loading & filters ----------

function loadDataset(rows, sourceName) {
    allData = rows;
    lastSourceName = sourceName || null;
    expandedUids = new Set();
    document.getElementById("upload-zone").classList.add("has-data");
    document.getElementById("filter-bar").hidden = false;
    updateSourceNote();
    populateFilterOptions();
    resetFilterInputs();
    applyFilters();
    saveToStorage();
}

function updateSourceNote() {
    const note = document.getElementById("dataSourceNote");
    note.removeAttribute("data-i18n");
    note.textContent = lastSourceName ? t("subFile", lastSourceName, allData.length) : t("subManual", allData.length);
}

function ensureUiInitialized() {
    document.getElementById("upload-zone").classList.add("has-data");
    document.getElementById("filter-bar").hidden = false;
    if (!document.getElementById("f-from").value) resetFilterInputs();
}

function populateFilterOptions() {
    const cats = [...new Set(allData.flatMap(r => invoiceCategories(r)))].sort();
    const methods = [...new Set(allData.map(r => r.method))].sort();
    fillSelect("f-category", cats, t("allCategories"));
    fillSelect("f-method", methods, t("allMethods"));
    fillSelect("f-status", ["fulfilled", "pending"], t("allStatuses"), (v) => t(v === "fulfilled" ? "statusFulfilled" : "statusPending"));
}

function fillSelect(id, values, allLabel, labelFn) {
    const el = document.getElementById(id);
    const prev = el.value;
    el.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = ""; optAll.textContent = allLabel;
    el.appendChild(optAll);
    values.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v; opt.textContent = labelFn ? labelFn(v) : v;
        el.appendChild(opt);
    });
    if (values.includes(prev)) el.value = prev;
}

function resetFilterInputs() {
    document.getElementById("f-search").value = "";
    document.getElementById("f-category").value = "";
    document.getElementById("f-method").value = "";
    document.getElementById("f-status").value = "";
    if (allData.length) {
        const dates = allData.map(r => r.date.getTime());
        document.getElementById("f-from").value = new Date(Math.min(...dates)).toISOString().slice(0, 10);
        document.getElementById("f-to").value = new Date(Math.max(...dates)).toISOString().slice(0, 10);
    }
}

function applyFilters(logActivity) {
    const search = document.getElementById("f-search").value.trim().toLowerCase();
    const from = document.getElementById("f-from").value ? new Date(document.getElementById("f-from").value) : null;
    const to = document.getElementById("f-to").value ? new Date(document.getElementById("f-to").value + "T23:59:59") : null;
    const category = document.getElementById("f-category").value;
    const method = document.getElementById("f-method").value;
    const status = document.getElementById("f-status").value;

    filteredData = allData.filter(r => {
        if (search && !(r.customer.toLowerCase().includes(search) || r.id.toLowerCase().includes(search))) return false;
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        if (category && !invoiceCategories(r).includes(category)) return false;
        if (method && r.method !== method) return false;
        if (status && r.status !== status) return false;
        return true;
    });

    visibleCount = PAGE_SIZE;
    renderAll();
    if (logActivity) addActivityLine(t("actFiltered", filteredData.length));
}

// ---------- Local persistence (this browser only) ----------

function saveToStorage() {
    try {
        const payload = allData.map(r => ({ ...r, date: r.date.toISOString() }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem(STORAGE_SOURCE_KEY, lastSourceName || "");
    } catch (e) { /* storage unavailable or full — the ledger still works this session */ }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.length) return null;
        const rows = parsed.map(migrateInvoiceRow).filter(Boolean);
        return rows.length ? rows : null;
    } catch (e) { return null; }
}

// Accepts either the current items-based shape, or a legacy single-amount/
// single-category row (from an older version of this app, or a hand-edited
// backup) and normalizes it into a proper multi-item invoice.
function migrateInvoiceRow(r) {
    const date = new Date(r.date);
    if (isNaN(date.getTime())) return null;
    let items;
    if (Array.isArray(r.items) && r.items.length) {
        items = r.items.map(it => makeItem({
            _iid: it._iid || makeUid(),
            description: it.description || it.category || "Item",
            category: it.category || "Other",
            quantity: Number(it.quantity) > 0 ? Number(it.quantity) : 1,
            unitPrice: Number(it.unitPrice) || 0,
        }));
    } else if (!isNaN(parseFloat(r.amount))) {
        items = [makeItem({
            description: r.category || "Item",
            category: r.category || "Other",
            quantity: 1,
            unitPrice: parseFloat(r.amount) || 0,
        })];
    } else {
        return null;
    }
    const row = {
        id: String(r.id || `#${1000 + Math.floor(Math.random() * 9000)}`).trim(),
        customer: String(r.customer || "Unknown").trim(),
        date,
        method: r.method ? String(r.method).trim().toLowerCase() : "card",
        status: r.status === "pending" ? "pending" : "fulfilled",
        items,
        _uid: r._uid || makeUid(),
    };
    return syncInvoiceCalc(row);
}

function clearData() {
    if (!allData.length) return;
    if (!confirm(t("confirmClear"))) return;
    allData = [];
    filteredData = [];
    lastSourceName = null;
    visibleCount = PAGE_SIZE;
    sortState = { key: "date", dir: "desc" };
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_SOURCE_KEY);
    } catch (e) { /* storage unavailable */ }
    document.getElementById("upload-zone").classList.remove("has-data");
    document.getElementById("filter-bar").hidden = true;
    const note = document.getElementById("dataSourceNote");
    note.setAttribute("data-i18n", "subDemo");
    note.textContent = t("subDemo");
    renderAll();
    addActivityLine(t("actCleared"));
}

// ---------- Manual entry: add / edit / delete ----------

function nextOrderNumber() {
    let max = 999;
    allData.forEach(r => { const m = /(\d+)/.exec(r.id); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    return max + 1;
}

function ensureDateInRange(date) {
    const iso = date.toISOString().slice(0, 10);
    const fromEl = document.getElementById("f-from"), toEl = document.getElementById("f-to");
    if (!fromEl.value || iso < fromEl.value) fromEl.value = iso;
    if (!toEl.value || iso > toEl.value) toEl.value = iso;
}

function populateCategoryDatalist() {
    const list = document.getElementById("item-category-list");
    if (!list) return;
    list.innerHTML = "";
    [...new Set(allData.flatMap(r => invoiceCategories(r)))].sort().forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        list.appendChild(opt);
    });
}

// ---------- Line-item rows inside the entry modal ----------

function createItemRowEl(item) {
    const row = document.createElement("div");
    row.className = "item-row";
    row.dataset.iid = item._iid;
    row.innerHTML = `
        <input type="text" class="item-description" data-i18n-ph="itemDescriptionPh" placeholder="${escapeHtml(t("itemDescriptionPh"))}" value="${escapeHtml(item.description)}">
        <input type="text" class="item-category" list="item-category-list" data-i18n-ph="itemCategoryPh" placeholder="${escapeHtml(t("itemCategoryPh"))}" value="${escapeHtml(item.category)}">
        <input type="number" class="item-qty" min="0.01" step="1" data-i18n-ph="itemQtyPh" placeholder="${escapeHtml(t("itemQtyPh"))}" value="${item.quantity}">
        <input type="text" class="item-price" inputmode="decimal" data-i18n-ph="itemPricePh" placeholder="${escapeHtml(t("itemPricePh"))}" value="${item.unitPrice}">
        <span class="item-line-total">${fmtCurrency(lineTotal(item))}</span>
        <button type="button" class="item-remove" aria-label="${escapeHtml(t("removeItem"))}">&times;</button>
    `;
    const qtyEl = row.querySelector(".item-qty");
    const priceEl = row.querySelector(".item-price");
    qtyEl.addEventListener("input", updateModalTotals);
    priceEl.addEventListener("input", updateModalTotals);
    priceEl.addEventListener("blur", () => {
        const result = evalSimpleExpression(priceEl.value);
        if (result !== null) priceEl.value = result;
        updateModalTotals();
    });
    row.querySelector(".item-remove").addEventListener("click", () => {
        // keep at least one item row so the invoice always has something to save
        if (document.querySelectorAll("#items-list .item-row").length <= 1) return;
        row.remove();
        updateModalTotals();
    });
    return row;
}

function addItemRow(item) {
    const list = document.getElementById("items-list");
    list.appendChild(createItemRowEl(item || makeItem({})));
    updateModalTotals();
}

function updateModalTotals() {
    let total = 0;
    document.querySelectorAll("#items-list .item-row").forEach(row => {
        const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
        const price = parseFloat(row.querySelector(".item-price").value) || 0;
        const lt = qty * price;
        row.querySelector(".item-line-total").textContent = fmtCurrency(lt);
        total += lt;
    });
    const totalEl = document.getElementById("items-total-value");
    if (totalEl) totalEl.textContent = fmtCurrency(total);
}

function readItemsFromModal() {
    return [...document.querySelectorAll("#items-list .item-row")].map(row => {
        const qty = parseFloat(row.querySelector(".item-qty").value);
        const priceRaw = row.querySelector(".item-price").value;
        const resolved = evalSimpleExpression(priceRaw);
        const price = resolved !== null ? resolved : parseFloat(priceRaw);
        return makeItem({
            _iid: row.dataset.iid,
            description: row.querySelector(".item-description").value.trim(),
            category: row.querySelector(".item-category").value.trim() || "Other",
            quantity: qty > 0 ? qty : 1,
            unitPrice: isFinite(price) ? price : 0,
        });
    });
}

function openEntryModal(mode, uid) {
    populateCategoryDatalist();
    document.getElementById("entry-form").reset();
    document.getElementById("ef-uid").value = "";
    document.getElementById("items-list").innerHTML = "";
    const titleEl = document.getElementById("modal-title");
    titleEl.removeAttribute("data-i18n");

    if (mode === "edit") {
        const row = allData.find(r => r._uid === uid);
        if (!row) return;
        titleEl.textContent = t("editEntryTitle");
        document.getElementById("ef-uid").value = row._uid;
        document.getElementById("ef-customer").value = row.customer;
        document.getElementById("ef-date").value = row.date.toISOString().slice(0, 10);
        document.getElementById("ef-method").value = row.method;
        document.getElementById("ef-status").value = row.status;
        row.items.forEach(it => addItemRow(it));
    } else {
        titleEl.textContent = t("addEntryTitle");
        document.getElementById("ef-date").value = new Date().toISOString().slice(0, 10);
        document.getElementById("ef-method").value = "card";
        document.getElementById("ef-status").value = "fulfilled";
        addItemRow(makeItem({}));
    }
    updateModalTotals();
    document.getElementById("entry-modal").hidden = false;
    document.getElementById("ef-customer").focus();
}

function closeEntryModal() {
    document.getElementById("entry-modal").hidden = true;
}

function submitEntryForm() {
    const uid = document.getElementById("ef-uid").value;
    const customer = document.getElementById("ef-customer").value.trim();
    const date = new Date(document.getElementById("ef-date").value);
    const method = document.getElementById("ef-method").value;
    const status = document.getElementById("ef-status").value;
    const items = readItemsFromModal();
    if (!customer || isNaN(date.getTime()) || !items.length) return;

    playAdderSound();

    if (uid) {
        const row = allData.find(r => r._uid === uid);
        if (row) {
            Object.assign(row, { customer, date, method, status, items });
            syncInvoiceCalc(row);
        }
        addActivityLine(t("actEdited", customer));
    } else {
        const row = { id: `#${nextOrderNumber()}`, customer, date, method, status, items, _uid: makeUid() };
        syncInvoiceCalc(row);
        allData.push(row);
        addActivityLine(t("actAdded", customer));
    }

    ensureUiInitialized();
    ensureDateInRange(date);
    populateFilterOptions();
    applyFilters();
    saveToStorage();
    closeEntryModal();
}

function deleteEntry(uid) {
    const row = allData.find(r => r._uid === uid);
    if (!row) return;
    if (!confirm(t("confirmDelete"))) return;
    allData = allData.filter(r => r._uid !== uid);
    populateFilterOptions();
    applyFilters();
    saveToStorage();
    addActivityLine(t("actDeleted", row.customer));
    playAdderSound();
}

// ---------- KPI computation ----------

function computeKpiSet(data) {
    const revenue = data.reduce((s, r) => s + r.amount, 0);
    const count = data.length;
    const custCounts = {};
    data.forEach(r => custCounts[r.customer] = (custCounts[r.customer] || 0) + 1);
    const repeat = Object.values(custCounts).filter(c => c > 1).length;
    const fulfilled = data.filter(r => r.status === "fulfilled").length;
    const fulfillmentRate = count ? (fulfilled / count) * 100 : 0;
    const aov = count ? revenue / count : 0;
    return { revenue, count, repeat, fulfillmentRate, aov };
}

function splitHalves(data) {
    if (data.length < 2) return [data, []];
    const sorted = [...data].sort((a, b) => a.date - b.date);
    const mid = Math.floor(sorted.length / 2);
    return [sorted.slice(0, mid), sorted.slice(mid)];
}

function renderKpis() {
    const current = computeKpiSet(filteredData);
    const [firstHalf, secondHalf] = splitHalves(filteredData);
    const prev = computeKpiSet(firstHalf);
    const now = computeKpiSet(secondHalf.length ? secondHalf : filteredData);

    document.getElementById("kpi-revenue").textContent = fmtCurrency(current.revenue);
    document.getElementById("kpi-repeat").textContent = fmtNumber(current.repeat);
    document.getElementById("kpi-fulfillment").textContent = current.count ? current.fulfillmentRate.toFixed(1) + "%" : "—";
    document.getElementById("kpi-aov").textContent = fmtCurrency(current.aov);

    setDelta("kpi-revenue-delta", pctDelta(prev.revenue, now.revenue), "%");
    setDelta("kpi-repeat-delta", pctDelta(prev.repeat, now.repeat), "%");
    setDelta("kpi-fulfillment-delta", now.fulfillmentRate - prev.fulfillmentRate, t("ptsShort"), true);
    setDelta("kpi-aov-delta", pctDelta(prev.aov, now.aov), "%");
}

function pctDelta(prev, now) {
    if (!prev) return now ? 100 : 0;
    return ((now - prev) / prev) * 100;
}

function setDelta(elId, value, unit, isPointsDiff) {
    const el = document.getElementById(elId);
    if (!isFinite(value) || filteredData.length < 2) { el.textContent = ""; el.className = "kpi-delta"; return; }
    const rounded = Math.abs(value) < 0.05 ? 0 : value;
    const arrow = rounded > 0 ? "▲" : rounded < 0 ? "▼" : "•";
    const cls = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
    const num = isPointsDiff ? Math.abs(rounded).toFixed(1) : Math.abs(rounded).toFixed(1);
    el.textContent = `${arrow} ${num}${unit} ${t("vsPrevPeriod")}`;
    el.className = "kpi-delta " + cls;
}

// ---------- Charts ----------

function destroyCharts() { Object.values(charts).forEach(c => c && c.destroy()); charts = {}; }

function tooltipTheme() {
    return { backgroundColor: '#0F2A20', titleColor: '#E8C25C', bodyColor: '#EDE3C8', borderColor: '#C9A227', borderWidth: 1, padding: 10 };
}

function renderCharts() {
    destroyCharts();
    if (!filteredData.length) return;

    // group by month
    const byMonth = {};
    filteredData.forEach(r => {
        const key = `${r.date.getFullYear()}-${r.date.getMonth()}`;
        if (!byMonth[key]) byMonth[key] = { revenue: 0, count: 0, y: r.date.getFullYear(), m: r.date.getMonth() };
        byMonth[key].revenue += r.amount;
        byMonth[key].count += 1;
    });
    const months = Object.values(byMonth).sort((a, b) => a.y - b.y || a.m - b.m);
    const labels = months.map(m => monthLabel(m.m));

    charts.revenue = new Chart(document.getElementById('revenueChart').getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: t("revenueLegend"), data: months.map(m => m.revenue), borderColor: forest, backgroundColor: forest, borderWidth: 2.5, borderCapStyle: 'round', borderJoinStyle: 'round', tension: 0.2, pointRadius: 3, pointBackgroundColor: forest, yAxisID: 'y' },
                { label: t("ordersLegend"), data: months.map(m => m.count), borderColor: brick, backgroundColor: brick, borderWidth: 2, borderCapStyle: 'round', borderDash: [4, 3], tension: 0.2, pointRadius: 0, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { color: ink, boxWidth: 14, padding: 16, font: { size: 11 } } }, tooltip: tooltipTheme() },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, grid: { color: 'rgba(127,168,138,0.22)' }, ticks: { callback: v => '$' + (v / 1000).toFixed(0) + 'k' } },
                y1: { beginAtZero: true, position: 'right', grid: { display: false } }
            }
        }
    });

    const byCategory = {};
    filteredData.forEach(r => (r.items || []).forEach(it => {
        byCategory[it.category] = (byCategory[it.category] || 0) + lineTotal(it);
    }));
    const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    charts.category = new Chart(document.getElementById('sourceChart').getContext('2d'), {
        type: 'doughnut',
        data: { labels: catEntries.map(e => e[0]), datasets: [{ data: catEntries.map(e => e[1]), backgroundColor: catPalette, borderColor: '#0F2A20', borderWidth: 3, hoverOffset: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: { legend: { position: 'bottom', labels: { color: ink, boxWidth: 12, padding: 14, font: { size: 10.5 } } }, tooltip: { ...tooltipTheme(), callbacks: { label: (ctx) => `${ctx.label}: ${fmtCurrency(ctx.parsed)}` } } } }
    });

    const byCustomer = {};
    filteredData.forEach(r => byCustomer[r.customer] = (byCustomer[r.customer] || 0) + r.amount);
    const topCustomers = Object.entries(byCustomer).sort((a, b) => b[1] - a[1]).slice(0, 6).reverse();
    charts.topCustomers = new Chart(document.getElementById('topCustomersChart').getContext('2d'), {
        type: 'bar',
        data: { labels: topCustomers.map(e => e[0]), datasets: [{ data: topCustomers.map(e => e[1]), backgroundColor: forest }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...tooltipTheme(), callbacks: { label: ctx => fmtCurrency(ctx.parsed.x) } } },
            scales: { x: { beginAtZero: true, grid: { color: 'rgba(127,168,138,0.22)' }, ticks: { callback: v => '$' + (v / 1000).toFixed(1) + 'k' } }, y: { grid: { display: false } } } }
    });

    const byMethod = {};
    filteredData.forEach(r => byMethod[r.method] = (byMethod[r.method] || 0) + 1);
    const methodEntries = Object.entries(byMethod);
    charts.method = new Chart(document.getElementById('methodChart').getContext('2d'), {
        type: 'bar',
        data: { labels: methodEntries.map(e => e[0]), datasets: [{ data: methodEntries.map(e => e[1]), backgroundColor: [forest, gold, '#7A8A78', '#8B5E4A'] }] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: tooltipTheme() },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(127,168,138,0.22)' }, ticks: { precision: 0 } } } }
    });
}

// ---------- Table ----------

function sortedFilteredData() {
    const { key, dir } = sortState;
    const mult = dir === "asc" ? 1 : -1;
    return [...filteredData].sort((a, b) => {
        let va = a[key], vb = b[key];
        if (key === "date") { va = va.getTime(); vb = vb.getTime(); }
        if (key === "amount") { /* numeric already */ }
        else if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        if (va < vb) return -1 * mult;
        if (va > vb) return 1 * mult;
        return 0;
    });
}

function renderTable() {
    const tbody = document.getElementById("txn-tbody");
    tbody.innerHTML = "";
    document.getElementById("txn-count-note").textContent = t("txnCount", filteredData.length);

    if (!allData.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-note">${t("emptyState")}</td></tr>`;
        document.getElementById("show-more-btn").hidden = true;
        return;
    }
    if (!filteredData.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-note">${t("noMatches")}</td></tr>`;
        document.getElementById("show-more-btn").hidden = true;
        return;
    }

    const sorted = sortedFilteredData();
    const visible = sorted.slice(0, visibleCount);
    visible.forEach(r => {
        const multi = (r.items || []).length > 1;
        const expanded = expandedUids.has(r._uid);
        const tr = document.createElement("tr");
        tr.className = "invoice-row";
        tr.innerHTML = `
            <td>${multi ? `<button type="button" class="row-expand" data-action="toggle" data-uid="${r._uid}" aria-expanded="${expanded}" aria-label="${escapeHtml(t("toggleItems"))}">${expanded ? "▾" : "▸"}</button>` : ""}${escapeHtml(r.id)}</td>
            <td>${escapeHtml(r.customer)}</td>
            <td>${fmtCurrency(r.amount)}</td>
            <td>${fmtDate(r.date)}</td>
            <td>${escapeHtml(r.category)}${multi ? ` <span class="item-count">${t("itemsCount", r.items.length)}</span>` : ""}</td>
            <td><span class="tag ${escapeHtml(r.method)}">${escapeHtml(r.method)}</span></td>
            <td><span class="stamp ${r.status}">${t(r.status === "fulfilled" ? "statusFulfilled" : "statusPending")}</span></td>
            <td class="row-actions">
                <button type="button" class="row-action" data-action="edit" data-uid="${r._uid}">${t("editAction")}</button>
                <button type="button" class="row-action danger" data-action="delete" data-uid="${r._uid}">${t("deleteAction")}</button>
            </td>
        `;
        tbody.appendChild(tr);

        if (multi && expanded) {
            const detailTr = document.createElement("tr");
            detailTr.className = "invoice-detail-row";
            const itemsHtml = r.items.map(it => `
                <div class="invoice-item-line">
                    <span class="ii-desc">${escapeHtml(it.description || it.category)}</span>
                    <span class="ii-cat">${escapeHtml(it.category)}</span>
                    <span class="ii-qty">${fmtNumber(it.quantity)}×</span>
                    <span class="ii-price">${fmtCurrency(it.unitPrice)}</span>
                    <span class="ii-total">${fmtCurrency(lineTotal(it))}</span>
                </div>`).join("");
            detailTr.innerHTML = `<td colspan="8"><div class="invoice-items-detail">${itemsHtml}</div></td>`;
            tbody.appendChild(detailTr);
        }
    });

    const moreBtn = document.getElementById("show-more-btn");
    const remaining = sorted.length - visible.length;
    if (remaining > 0) {
        moreBtn.hidden = false;
        moreBtn.textContent = t("showMore", Math.min(PAGE_SIZE, remaining));
    } else if (visibleCount > PAGE_SIZE) {
        moreBtn.hidden = false;
        moreBtn.textContent = t("showLess");
    } else {
        moreBtn.hidden = true;
    }

    document.querySelectorAll("thead th[data-sort]").forEach(th => {
        th.classList.toggle("sorted", th.dataset.sort === sortState.key);
        th.classList.toggle("asc", th.dataset.sort === sortState.key && sortState.dir === "asc");
    });
}

// ---------- Activity log ----------

function timeNow() {
    return new Date().toLocaleTimeString(STATE.lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", { hour: "2-digit", minute: "2-digit" });
}

function addActivityLine(text) {
    const list = document.getElementById("activity-list");
    const item = document.createElement("div");
    item.className = "activity-item is-new";
    const timeEl = document.createElement("span");
    timeEl.className = "activity-time";
    timeEl.textContent = timeNow();
    const textEl = document.createElement("span");
    textEl.className = "activity-text";
    // textContent, never innerHTML: `text` can embed a customer name that
    // came from an uploaded CSV, manual entry, or an imported backup file.
    textEl.textContent = text;
    item.append(timeEl, textEl);
    list.prepend(item);
    while (list.children.length > 6) list.removeChild(list.lastElementChild);
    setTimeout(() => item.classList.remove("is-new"), 1500);
}

// ---------- Export ----------

function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}

function exportCSV() {
    const invoices = sortedFilteredData();
    if (!invoices.length) return;
    const header = "order,customer,amount,date,method,category,status";
    // One CSV row per line item, repeating the invoice's order number so the
    // file re-groups into the same multi-item invoice on re-import.
    const lines = invoices.flatMap(r => r.items.map(it => [
        csvField(r.id), csvField(r.customer), lineTotal(it),
        r.date.toISOString().slice(0, 10), csvField(r.method), csvField(it.category), csvField(r.status),
    ].join(",")));
    downloadBlob([header, ...lines].join("\n"), "ledger-export.csv", "text/csv");
    addActivityLine(t("actExported", lines.length));
}

function downloadTemplate() {
    const header = "order,customer,amount,date,method,category,status";
    const sample = [
        "#2001,Jane Doe,120.50,2026-03-14,card,Retail,fulfilled",
        "#2001,Jane Doe,45.00,2026-03-14,card,Services,fulfilled",
        "#2002,John Smith,860.00,2026-03-15,transfer,Wholesale,pending",
    ];
    downloadBlob([header, ...sample].join("\n"), "ledger-template.csv", "text/csv");
}

// ---------- Micro-interaction sounds (synthesized, no audio files) ----------

let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
}

// A short mechanical "adding machine" clunk — two quick clicks with a metallic overtone.
function playAdderSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.055].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(i === 0 ? 720 : 480, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.05);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.06);
    });
}

// A soft paper-turn hiss — filtered noise burst with a rising-then-falling envelope.
function playPageTurnSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const duration = 0.35;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2200;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
}

// ---------- Inline calculator (ledger "amount" field) ----------

function evalSimpleExpression(str) {
    const cleaned = str.trim();
    // Must contain at least one operator (not just a plain number) and only safe characters.
    if (!cleaned || !/^[0-9\s+\-*/.()]+$/.test(cleaned) || !/[+\-*/]/.test(cleaned)) return null;
    try {
        const val = Function('"use strict"; return (' + cleaned + ')')();
        return typeof val === "number" && isFinite(val) ? Math.round(val * 100) / 100 : null;
    } catch (e) { return null; }
}

// ---------- JSON backup & restore ----------

function exportBackup() {
    if (!allData.length) return;
    const payload = {
        version: 2, // v2 adds multi-item invoices (r.items); v1 backups still import fine
        exportedAt: new Date().toISOString(),
        source: lastSourceName,
        data: allData.map(r => ({ ...r, date: r.date.toISOString() })),
    };
    downloadBlob(JSON.stringify(payload, null, 2), "ledger-backup.json", "application/json");
    addActivityLine(t("actBackupExported", allData.length));
}

function importBackupFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const source = Array.isArray(parsed) ? parsed : parsed.data;
            if (!Array.isArray(source) || !source.length) throw new Error("empty");
            const rows = source.map(migrateInvoiceRow).filter(Boolean);
            if (!rows.length) throw new Error("empty");
            loadDataset(rows, (parsed.source) || file.name);
            addActivityLine(t("actBackupImported", rows.length));
        } catch (e) {
            showError(t("errBackupParse"));
        }
    };
    reader.readAsText(file);
}

// ---------- PDF report export ----------
// Note: typeset in English regardless of active UI language — jsPDF's
// built-in fonts don't carry Arabic glyphs, so Arabic text would render
// as empty boxes. See STRINGS.en.pdfNote.

function exportPDF() {
    if (!window.jspdf || !filteredData.length) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Deep emerald masthead band
    doc.setFillColor(10, 29, 22);
    doc.rect(0, 0, pageW, 96, "F");
    doc.setTextColor(232, 194, 92);
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.text("THE LEDGER", pageW / 2, 42, { align: "center" });
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(210, 200, 170);
    doc.text(`Transaction report — generated ${new Date().toLocaleDateString("en-US")}`, pageW / 2, 62, { align: "center" });
    doc.setDrawColor(201, 162, 39);
    doc.setLineWidth(1);
    doc.line(60, 78, pageW - 60, 78);

    // Parchment body
    doc.setFillColor(237, 227, 200);
    doc.rect(0, 96, pageW, doc.internal.pageSize.getHeight() - 96, "F");

    // KPI strip
    const kpi = computeKpiSet(filteredData);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 20);
    const kpiY = 122;
    const kpiLabels = [
        ["Gross revenue", fmtCurrency(kpi.revenue)],
        ["Entries", String(kpi.count)],
        ["Fulfillment rate", kpi.count ? kpi.fulfillmentRate.toFixed(1) + "%" : "—"],
        ["Avg. order value", fmtCurrency(kpi.aov)],
    ];
    const colW = (pageW - 80) / 4;
    kpiLabels.forEach((pair, i) => {
        const x = 40 + i * colW;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(90, 80, 55);
        doc.text(pair[0].toUpperCase(), x, kpiY);
        doc.setFont("times", "bold");
        doc.setFontSize(15);
        doc.setTextColor(18, 51, 38);
        doc.text(pair[1], x, kpiY + 20);
    });
    doc.setDrawColor(201, 162, 39, 0.5);
    doc.line(40, kpiY + 32, pageW - 40, kpiY + 32);

    const rows = sortedFilteredData().map(r => [
        r.id, r.customer, fmtCurrency(r.amount), r.date.toISOString().slice(0, 10),
        r.category, r.method, r.status === "fulfilled" ? "Fulfilled" : "Pending",
    ]);

    doc.autoTable({
        startY: kpiY + 48,
        margin: { left: 40, right: 40 },
        head: [["Order", "Customer", "Amount", "Date", "Category", "Method", "Status"]],
        body: rows,
        theme: "grid",
        styles: { font: "helvetica", fontSize: 8, textColor: [40, 38, 28], lineColor: [201, 162, 39], lineWidth: 0.6, cellPadding: 5 },
        headStyles: { fillColor: [18, 51, 38], textColor: [232, 194, 92], fontStyle: "bold", lineColor: [201, 162, 39] },
        alternateRowStyles: { fillColor: [229, 217, 186] },
        didDrawPage: () => {
            const h = doc.internal.pageSize.getHeight();
            doc.setFontSize(7.5);
            doc.setTextColor(110, 102, 80);
            doc.text("The Ledger — Ahmed Sobhy", 40, h - 24);
            doc.text(String(doc.internal.getNumberOfPages()), pageW - 40, h - 24, { align: "right" });
        },
    });

    doc.save("ledger-report.pdf");
    addActivityLine(t("actPdfExported", filteredData.length));
}

// ---------- Language switching ----------

function setLanguage(lang) {
    STATE.lang = lang;
    localStorage.setItem("ledger-lang", lang);
    applyStaticTranslations();
    if (allData.length) {
        updateSourceNote();
    }
    populateFilterOptions();
    renderAll();
}

// ---------- Master render ----------

function renderAll() {
    renderKpis();
    renderCharts();
    renderTable();
}

// ---------- Wiring ----------

document.addEventListener("DOMContentLoaded", () => {
    applyStaticTranslations();

    document.getElementById("lang-btn").addEventListener("click", () => {
        const next = STATE.lang === "en" ? "ar" : "en";
        setLanguage(next);
        addActivityLine(STRINGS[next].actLangSwitch);
    });

    document.getElementById("sample-btn").addEventListener("click", () => {
        const rows = generateSampleData();
        loadDataset(rows, "sample-data.csv");
        addActivityLine(t("actSample", rows.length));
        playPageTurnSound();
    });

    document.getElementById("upload-btn").addEventListener("click", () => document.getElementById("file-input").click());
    document.getElementById("file-input").addEventListener("change", (e) => {
        if (e.target.files[0]) { parseCSVFile(e.target.files[0]); playPageTurnSound(); }
    });

    const dropZone = document.getElementById("upload-zone");
    ["dragenter", "dragover"].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); }));
    ["dragleave", "drop"].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove("drag-over"); }));
    dropZone.addEventListener("drop", (e) => {
        const file = e.dataTransfer.files[0];
        if (file) parseCSVFile(file);
    });

    document.getElementById("template-btn").addEventListener("click", downloadTemplate);
    document.getElementById("export-btn").addEventListener("click", exportCSV);
    document.getElementById("pdf-btn").addEventListener("click", exportPDF);

    document.getElementById("backup-export-btn").addEventListener("click", exportBackup);
    document.getElementById("backup-import-btn").addEventListener("click", () => document.getElementById("backup-file-input").click());
    document.getElementById("backup-file-input").addEventListener("change", (e) => {
        if (e.target.files[0]) importBackupFile(e.target.files[0]);
        e.target.value = "";
    });
    document.getElementById("clear-data-btn").addEventListener("click", clearData);

    document.getElementById("add-item-btn").addEventListener("click", () => addItemRow(makeItem({})));

    ["f-search", "f-from", "f-to", "f-category", "f-method", "f-status"].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener(id === "f-search" ? "input" : "change", () => applyFilters(true));
    });
    document.getElementById("f-reset").addEventListener("click", () => { resetFilterInputs(); applyFilters(true); });

    document.querySelectorAll("thead th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.dataset.sort;
            if (sortState.key === key) sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
            else sortState = { key, dir: "asc" };
            renderTable();
        });
    });

    document.getElementById("show-more-btn").addEventListener("click", () => {
        visibleCount = visibleCount > PAGE_SIZE && visibleCount >= filteredData.length ? PAGE_SIZE : visibleCount + PAGE_SIZE;
        renderTable();
    });

    document.getElementById("txn-tbody").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const uid = btn.dataset.uid;
        if (btn.dataset.action === "edit") openEntryModal("edit", uid);
        else if (btn.dataset.action === "delete") deleteEntry(uid);
        else if (btn.dataset.action === "toggle") {
            if (expandedUids.has(uid)) expandedUids.delete(uid); else expandedUids.add(uid);
            renderTable();
        }
    });

    document.getElementById("add-entry-btn").addEventListener("click", () => openEntryModal("add"));
    document.getElementById("modal-close").addEventListener("click", closeEntryModal);
    document.getElementById("modal-cancel").addEventListener("click", closeEntryModal);
    document.getElementById("entry-modal").addEventListener("click", (e) => {
        if (e.target.id === "entry-modal") closeEntryModal();
    });
    document.getElementById("entry-form").addEventListener("submit", (e) => {
        e.preventDefault();
        submitEntryForm();
    });

    const saved = loadFromStorage();
    if (saved) {
        allData = saved;
        lastSourceName = localStorage.getItem(STORAGE_SOURCE_KEY) || null;
        document.getElementById("upload-zone").classList.add("has-data");
        document.getElementById("filter-bar").hidden = false;
        updateSourceNote();
        populateFilterOptions();
        resetFilterInputs();
        applyFilters();
        addActivityLine(t("actRestored", allData.length));
    } else {
        renderTable(); // empty state before any data is loaded
    }
});
