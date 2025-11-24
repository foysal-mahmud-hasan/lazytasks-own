export function translate(key) {
    const value = window.appLocalizer?.i18n?.[key];
    // if (!value) {
    //     console.warn(`Missing translation key: "${key}"`);
    //     return key;
    // }
    return window.appLocalizer?.i18n[key] || key;
}

export function toBengaliNumber(num) {
    const bengaliDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(num).replace(/\d/g, d => bengaliDigits[d]);
}