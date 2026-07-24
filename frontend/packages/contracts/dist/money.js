"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMinor = toMinor;
exports.fromMinor = fromMinor;
exports.addMoney = addMoney;
exports.subMoney = subMoney;
exports.mulMoney = mulMoney;
exports.sumMoney = sumMoney;
exports.formatBRL = formatBRL;
const dinero_js_1 = require("dinero.js");
const BRL = { code: 'BRL', base: 10, exponent: 2 };
const MONEY_CURRENCY = 'BRL';
function toNumber(value) {
    if (typeof value === 'number')
        return value;
    const normalized = value.replace(/\./g, '').replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}
function toMinor(value) {
    return Math.round(toNumber(value) * 100);
}
function fromMinor(minor) {
    return minor / 100;
}
function money(value) {
    return (0, dinero_js_1.dinero)({
        amount: toMinor(value),
        currency: BRL,
    });
}
function fromDinero(value) {
    return fromMinor(toMinor(Number((0, dinero_js_1.toDecimal)(value))));
}
function toScaledMultiplier(multiplier) {
    if (Number.isInteger(multiplier))
        return multiplier;
    const asString = multiplier.toString();
    const decimals = asString.includes('.') ? asString.split('.')[1].length : 0;
    return {
        amount: Number(asString.replace('.', '')),
        scale: decimals,
    };
}
function addMoney(a, b) {
    return fromDinero((0, dinero_js_1.add)(money(a), money(b)));
}
function subMoney(a, b) {
    return fromDinero((0, dinero_js_1.subtract)(money(a), money(b)));
}
function mulMoney(value, multiplier) {
    return fromDinero((0, dinero_js_1.multiply)(money(value), toScaledMultiplier(multiplier)));
}
function sumMoney(values) {
    const totalMinor = values.reduce((acc, current) => acc + toMinor(current), 0);
    return fromMinor(totalMinor);
}
function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: MONEY_CURRENCY,
    }).format(fromMinor(toMinor(value)));
}
