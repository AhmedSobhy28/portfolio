// The Ledger — translations and i18n helpers.
// Two languages: English (ltr) and Arabic (rtl). Everything user-facing
// routes through t(key) so the whole UI can flip without a reload.

const STRINGS = {
    en: {
        title: "The Ledger",
        subDemo: "A private ledger of small-business figures — sample data. Upload a CSV to enter your own.",
        subFile: (name, count) => `Ledger of ${count} entries, drawn from ${name}.`,
        subManual: (count) => `Ledger of ${count} entries, kept in this browser.`,
        loadSample: "Load sample data",
        exportCsv: "Export CSV",
        uploadCsv: "Upload CSV",
        addEntry: "+ New entry",
        addEntryTitle: "New ledger entry",
        editEntryTitle: "Edit ledger entry",
        formCustomer: "Customer", formAmount: "Amount", formDate: "Date",
        formCategory: "Category", formMethod: "Method", formStatus: "Status",
        save: "Save entry", cancel: "Cancel",
        colActions: "Actions", editAction: "Edit", deleteAction: "Delete",
        confirmDelete: "Delete this entry? This can't be undone.",
        dropTitle: 'Drop a transactions CSV here, or use "Upload CSV" above',
        dropSub: "Expected columns: order, customer, amount, date, method, category, status. Repeat the same order # on multiple rows to combine them into one multi-item invoice.",
        downloadTemplate: "Download template",
        formItems: "Items",
        addItem: "+ Add item",
        removeItem: "Remove item",
        itemDescriptionPh: "Description",
        itemCategoryPh: "Category",
        itemQtyPh: "Qty",
        itemPricePh: "Unit price",
        itemsTotalLabel: "Invoice total",
        itemsCount: (n) => `(${n} items)`,
        toggleItems: "Show/hide items",
        fSearch: "Search", fSearchPh: "Customer or order #",
        fFrom: "From", fTo: "To",
        fCategory: "Category", fMethod: "Method", fStatus: "Status",
        fReset: "Reset filters",
        allCategories: "All categories", allMethods: "All methods", allStatuses: "All statuses",
        kpiRevenue: "Gross revenue", kpiRepeat: "Repeat customers",
        kpiFulfillment: "Fulfillment rate", kpiAov: "Avg. order value",
        panelRevenue: "Revenue & order volume, by month",
        panelCategory: "Revenue by category",
        panelTopCustomers: "Top customers",
        panelMethod: "Payment methods",
        panelTransactions: "Transactions",
        panelActivity: "Activity",
        colOrder: "Order", colCustomer: "Customer", colAmount: "Amount",
        colDate: "Date", colCategory: "Category", colMethod: "Method", colStatus: "Status",
        statusFulfilled: "Fulfilled", statusPending: "Pending",
        showMore: (n) => `Show ${n} more`,
        showLess: "Show fewer",
        backToPortfolio: "Back to portfolio",
        footNote: "Built by Ahmed Sobhy — upload your own transaction data, or explore the bundled sample dataset.",
        emptyState: "No transactions loaded yet. Upload a CSV or load the sample dataset above.",
        noMatches: "No transactions match the current filters.",
        revenueLegend: "Revenue", ordersLegend: "Orders",
        actSynced: "Data loaded — dashboard refreshed.",
        actUploaded: (invoices, items) => items > invoices
            ? `Imported ${invoices} invoice(s) (${items} line items) from CSV.`
            : `Imported ${invoices} transactions from CSV.`,
        actSample: (n) => `Loaded ${n} sample transactions.`,
        actExported: (n) => `Exported ${n} transactions to CSV.`,
        actFiltered: (n) => `Filters applied — ${n} transactions shown.`,
        actLangSwitch: "Language switched to Arabic.",
        actAdded: (name) => `Added a new entry for ${name}.`,
        actEdited: (name) => `Updated the entry for ${name}.`,
        actDeleted: (name) => `Deleted the entry for ${name}.`,
        actRestored: (n) => `Restored ${n} saved entries from this browser.`,
        errParse: "Couldn't read that file — check it's a valid CSV.",
        errColumns: (cols) => `Missing required column(s): ${cols.join(", ")}.`,
        errEmpty: "That CSV has no usable rows.",
        vsPrevPeriod: "vs. previous period",
        ptsShort: "pts",
        txnCount: (n) => `${n} entries`,
        backupExport: "Backup (JSON)",
        backupImport: "Restore backup",
        exportPdf: "Export PDF",
        calcHint: "Tip: type a sum like 150+40+20 in a price field and tab out",
        actBackupExported: (n) => `Exported a JSON backup of ${n} entries.`,
        actBackupImported: (n) => `Restored ${n} entries from a backup file.`,
        actPdfExported: (n) => `Generated a PDF report of ${n} transactions.`,
        errBackupParse: "Couldn't read that backup file — check it's a valid ledger JSON export.",
        pdfNote: "Note: PDF reports are typeset in English regardless of the active language, since the export font doesn't support Arabic glyphs.",
        clearData: "Clear ledger",
        confirmClear: "Clear all loaded data? This removes it from this browser too. This can't be undone.",
        actCleared: "Ledger cleared.",
    },
    ar: {
        title: "الدفتر",
        subDemo: "دفتر حسابات خاص لأرقام مشروعك الصغير — بيانات نموذجية. ارفع ملف CSV لتُدخل بياناتك.",
        subFile: (name, count) => `دفتر من ${count} قيدًا، مأخوذ من ${name}.`,
        subManual: (count) => `دفتر من ${count} قيدًا، محفوظ في هذا المتصفح.`,
        loadSample: "تحميل بيانات نموذجية",
        exportCsv: "تصدير CSV",
        uploadCsv: "رفع CSV",
        addEntry: "+ قيد جديد",
        addEntryTitle: "قيد دفتر جديد",
        editEntryTitle: "تعديل القيد",
        formCustomer: "العميل", formAmount: "المبلغ", formDate: "التاريخ",
        formCategory: "الفئة", formMethod: "طريقة الدفع", formStatus: "الحالة",
        save: "حفظ القيد", cancel: "إلغاء",
        colActions: "إجراءات", editAction: "تعديل", deleteAction: "حذف",
        confirmDelete: "حذف هذا القيد؟ لا يمكن التراجع عن هذا.",
        dropTitle: 'اسحب ملف معاملات CSV هنا، أو استخدم زر "رفع CSV" أعلاه',
        dropSub: "الأعمدة المطلوبة: order, customer, amount, date, method, category, status. كرّر نفس رقم الطلب في أكثر من صف لدمجها في فاتورة واحدة متعددة البنود.",
        downloadTemplate: "تحميل نموذج الملف",
        formItems: "البنود",
        addItem: "+ إضافة بند",
        removeItem: "حذف البند",
        itemDescriptionPh: "الوصف",
        itemCategoryPh: "الفئة",
        itemQtyPh: "الكمية",
        itemPricePh: "سعر الوحدة",
        itemsTotalLabel: "إجمالي الفاتورة",
        itemsCount: (n) => `(${n} بنود)`,
        toggleItems: "إظهار/إخفاء البنود",
        fSearch: "بحث", fSearchPh: "اسم العميل أو رقم الطلب",
        fFrom: "من", fTo: "إلى",
        fCategory: "الفئة", fMethod: "طريقة الدفع", fStatus: "الحالة",
        fReset: "إعادة ضبط الفلاتر",
        allCategories: "كل الفئات", allMethods: "كل الطرق", allStatuses: "كل الحالات",
        kpiRevenue: "إجمالي الإيرادات", kpiRepeat: "عملاء متكررون",
        kpiFulfillment: "معدل التنفيذ", kpiAov: "متوسط قيمة الطلب",
        panelRevenue: "الإيرادات وعدد الطلبات شهريًا",
        panelCategory: "الإيرادات حسب الفئة",
        panelTopCustomers: "أفضل العملاء",
        panelMethod: "طرق الدفع",
        panelTransactions: "المعاملات",
        panelActivity: "النشاط",
        colOrder: "الطلب", colCustomer: "العميل", colAmount: "المبلغ",
        colDate: "التاريخ", colCategory: "الفئة", colMethod: "طريقة الدفع", colStatus: "الحالة",
        statusFulfilled: "منفَّذ", statusPending: "قيد التنفيذ",
        showMore: (n) => `عرض ${n} إضافية`,
        showLess: "عرض أقل",
        backToPortfolio: "العودة إلى الملف الشخصي",
        footNote: "من تصميم أحمد صبحي — كل شيء يعمل داخل متصفحك، ويُحفظ تلقائيًا على هذا الجهاز.",
        emptyState: "لا توجد معاملات بعد. ارفع ملف CSV أو حمّل البيانات النموذجية أعلاه.",
        noMatches: "لا توجد معاملات مطابقة للفلاتر الحالية.",
        revenueLegend: "الإيرادات", ordersLegend: "الطلبات",
        actSynced: "تم تحميل البيانات — تحديث لوحة التحكم.",
        actUploaded: (invoices, items) => items > invoices
            ? `تم استيراد ${invoices} فاتورة (${items} بند) من ملف CSV.`
            : `تم استيراد ${invoices} معاملة من ملف CSV.`,
        actSample: (n) => `تم تحميل ${n} معاملة نموذجية.`,
        actExported: (n) => `تم تصدير ${n} معاملة إلى CSV.`,
        actFiltered: (n) => `تم تطبيق الفلاتر — ${n} معاملة معروضة.`,
        actLangSwitch: "تم تغيير اللغة إلى الإنجليزية.",
        actAdded: (name) => `تمت إضافة قيد جديد باسم ${name}.`,
        actEdited: (name) => `تم تحديث قيد ${name}.`,
        actDeleted: (name) => `تم حذف قيد ${name}.`,
        actRestored: (n) => `تمت استعادة ${n} قيدًا محفوظًا من هذا المتصفح.`,
        errParse: "تعذّرت قراءة الملف — تأكد أنه CSV صالح.",
        errColumns: (cols) => `أعمدة مطلوبة مفقودة: ${cols.join("، ")}.`,
        errEmpty: "ملف الـCSV هذا لا يحتوي على صفوف قابلة للاستخدام.",
        vsPrevPeriod: "مقارنة بالفترة السابقة",
        ptsShort: "نقطة",
        txnCount: (n) => `${n} سجل`,
        backupExport: "نسخة احتياطية (JSON)",
        backupImport: "استرجاع نسخة احتياطية",
        exportPdf: "تصدير PDF",
        calcHint: "نصيحة: اكتب عملية جمع مثل 150+40+20 في حقل السعر ثم انتقل للحقل التالي",
        actBackupExported: (n) => `تم تصدير نسخة احتياطية JSON من ${n} قيدًا.`,
        actBackupImported: (n) => `تم استرجاع ${n} قيدًا من ملف النسخة الاحتياطية.`,
        actPdfExported: (n) => `تم إنشاء تقرير PDF لـ ${n} معاملة.`,
        errBackupParse: "تعذّرت قراءة ملف النسخة الاحتياطية — تأكد أنه تصدير JSON صالح من الدفتر.",
        pdfNote: "ملاحظة: تقارير PDF تُكتب بالإنجليزية دائمًا لأن خط التصدير لا يدعم الحروف العربية.",
        clearData: "مسح الدفتر",
        confirmClear: "مسح كل البيانات المحمّلة؟ سيتم حذفها من هذا المتصفح أيضًا. لا يمكن التراجع عن هذا.",
        actCleared: "تم مسح الدفتر.",
    }
};

const STATE = { lang: localStorage.getItem("ledger-lang") || "en" };

function t(key, ...args) {
    const entry = STRINGS[STATE.lang][key];
    return typeof entry === "function" ? entry(...args) : entry;
}

function applyStaticTranslations() {
    document.documentElement.lang = STATE.lang;
    document.documentElement.dir = STATE.lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (STRINGS[STATE.lang][key] !== undefined) el.innerHTML = t(key);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
        const key = el.getAttribute("data-i18n-ph");
        if (STRINGS[STATE.lang][key] !== undefined) el.placeholder = t(key);
    });
    const pdfBtn = document.getElementById("pdf-btn");
    if (pdfBtn) pdfBtn.title = t("pdfNote");
}

function fmtCurrency(n) {
    const locale = STATE.lang === "ar" ? "ar-EG-u-nu-latn" : "en-US";
    return "$" + Number(n).toLocaleString(locale, { maximumFractionDigits: 0 });
}

function fmtNumber(n) {
    const locale = STATE.lang === "ar" ? "ar-EG-u-nu-latn" : "en-US";
    return Number(n).toLocaleString(locale, { maximumFractionDigits: 1 });
}

function fmtDate(d) {
    const locale = STATE.lang === "ar" ? "ar-EG-u-nu-latn" : "en-US";
    return new Date(d).toLocaleDateString(locale, { month: "short", day: "2-digit", year: "numeric" });
}

function monthLabel(monthIdx) {
    const namesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const namesAr = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    return (STATE.lang === "ar" ? namesAr : namesEn)[monthIdx];
}
