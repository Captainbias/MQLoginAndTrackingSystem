"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var axios_1 = require("axios");
var element_plus_1 = require("element-plus");
require("element-plus/es/components/message/style/css");
// ===============================
// CONSTANTS
// ===============================
var API_BASE = 'https://captainbias.pythonanywhere.com/'; // <-- Backend base URL
var timeOptions = [];
for (var hour = 0; hour < 24; hour++) {
    var h = hour.toString().padStart(2, '0');
    timeOptions.push("".concat(h, ":00"));
    timeOptions.push("".concat(h, ":30"));
}
// ===============================
// STATE VARIABLES
// ===============================
var workers = (0, vue_1.ref)([]);
var annualReview = (0, vue_1.ref)({});
var unpaidByWorker = (0, vue_1.ref)({}); // unpaidByWorker will be an object: { Alice: [], Bob: [], Charlie: [] }
// Form state
var form = (0, vue_1.reactive)({
    names: [],
    date: getTodayDateEST(), // 这里必须是 Date 对象
    loginTime: '',
    logoutTime: '',
    paid: false,
    hours: 0,
    overtime_hours: 0
});
// Input and UI state
var nameInput = (0, vue_1.ref)('');
var message = (0, vue_1.ref)('');
var isError = (0, vue_1.ref)(false);
var editDialogVisible = (0, vue_1.ref)(false);
var pastPaid = (0, vue_1.ref)({});
var editForm = (0, vue_1.ref)({});
var paidFormatter = function (row) { return row.paid ? 'Yes' : 'No'; };
function getTodayDateEST() {
    var now = new Date();
    var utc = now.getTime() + now.getTimezoneOffset() * 60000;
    var estOffset = -5 * 60 * 60 * 1000;
    return new Date(utc + estOffset);
}
function calculateHours(loginTime, logoutTime) {
    if (!loginTime || !logoutTime)
        return { hours: 0, overtime_hours: 0 };
    // 计算毫秒差
    var diffMs = logoutTime.getTime() - loginTime.getTime();
    if (diffMs <= 0)
        return { hours: 0, overtime_hours: 0 }; // 时间错误，返回0
    // 转换成小时
    var totalHours = diffMs / 1000 / 60 / 60;
    // 正常工作8小时以内算 hours，超过部分算加班
    var hours = Math.min(totalHours, 8);
    var overtime_hours = totalHours > 8 ? totalHours - 8 : 0;
    return { hours: hours, overtime_hours: overtime_hours };
}
function formatDate(d) {
    if (!d)
        return null;
    var date = new Date(d);
    return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
}
function formatTime(t) {
    if (!t)
        return null;
    // If it's already a string like "09:00:00" or "09:00"
    if (typeof t === 'string') {
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) {
            return t.length === 5 ? "".concat(t, ":00") : t; // add seconds if missing
        }
        return null; // not in a valid time format
    }
    // If it's a Date object
    if (t instanceof Date) {
        var hh = String(t.getHours()).padStart(2, '0');
        var mm = String(t.getMinutes()).padStart(2, '0');
        return "".concat(hh, ":").concat(mm, ":00");
    }
    return null;
}
function doubleDigitTime(t) {
    if (!t)
        return null;
    if (typeof t === 'string') {
        if (/^\d{2}:\d{2}(:\d{2})?$/.test(t)) {
            return t.slice(0, 5); // always return HH:MM
        }
        return null;
    }
    if (t instanceof Date) {
        var hh = String(t.getHours()).padStart(2, '0');
        var mm = String(t.getMinutes()).padStart(2, '0');
        return "".concat(hh, ":").concat(mm);
    }
    return null;
}
// 辅助函数：字符串转 Date（时分）
function timeStrToDate(str) {
    if (!str)
        return null;
    var _a = str.split(':').map(Number), h = _a[0], m = _a[1];
    var d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}
function toDate(timeStr) {
    var str;
    str = '';
    if (typeof timeStr !== 'string') {
        // 如果传进来的是 Date 对象，就格式化成字符串再解析
        if (timeStr instanceof Date) {
            var h_1 = timeStr.getHours().toString().padStart(2, '0');
            var m_1 = timeStr.getMinutes().toString().padStart(2, '0');
            str = "".concat(h_1, ":").concat(m_1);
        }
        else {
            // 不是字符串也不是 Date，返回 null 或抛错
            return null;
        }
    }
    var _a = str.split(':'), h = _a[0], m = _a[1];
    var d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);
    return d;
}
// ===============================
// WORKERS & ANNUAL REVIEW FETCH
// ===============================
function fetchWorkers() {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/workers"))];
                case 1:
                    res = _b.sent();
                    if (!res.ok)
                        throw new Error('Network error fetching workers');
                    _a = workers;
                    return [4 /*yield*/, res.json()];
                case 2:
                    _a.value = _b.sent();
                    console.log('Workers loaded:', workers.value);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    console.error(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchAnnualReview(year) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/annual_review?year=").concat(year))];
                case 1:
                    res = _b.sent();
                    if (!res.ok)
                        throw new Error('Network error fetching annual review');
                    _a = annualReview;
                    return [4 /*yield*/, res.json()];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _b.sent();
                    console.error(error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function refreshAllData() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        fetchWorkers(),
                        fetchAnnualReview(new Date().getFullYear()),
                        fetchUnpaidForAll()
                    ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ===============================
// ATTENDANCE MANAGEMENT
// ===============================
function addName() {
    var name = nameInput.value.trim();
    console.log('Trying to add:', name);
    if (name && !form.names.includes(name)) {
        form.names.push(name);
        console.log('Name added:', name);
    }
    nameInput.value = '';
    console.log('Input cleared, current names:', form.names);
}
function submitEntry() {
    return __awaiter(this, void 0, void 0, function () {
        var loginDateTime, logoutDateTime, allSuccessful, _i, _a, name_1, response, result, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    message.value = '';
                    isError.value = false;
                    if (!form.date || !form.loginTime || !form.logoutTime || form.names.length === 0) {
                        message.value = 'Please fill out all fields and add at least one name.';
                        isError.value = true;
                        return [2 /*return*/];
                    }
                    loginDateTime = "".concat(form.loginTime);
                    logoutDateTime = "".concat(form.logoutTime);
                    allSuccessful = true;
                    _i = 0, _a = form.names;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    name_1 = _a[_i];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/add_entry"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: name_1,
                                date: formatDate(form.date),
                                login_time: doubleDigitTime(loginDateTime),
                                logout_time: doubleDigitTime(logoutDateTime),
                                paid: form.paid,
                                hours: form.hours,
                                overtime_hours: form.overtime_hours
                            }),
                        })];
                case 3:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 4:
                    result = _b.sent();
                    if (!response.ok) {
                        allSuccessful = false;
                        console.error("Error for ".concat(name_1, ":"), result.error || 'Failed to add entry');
                    }
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _b.sent();
                    allSuccessful = false;
                    if (err_1 instanceof Error) {
                        console.error("Network error for ".concat(name_1, ":"), err_1.message);
                    }
                    else {
                        console.error("Network error for ".concat(name_1, ":"), err_1);
                    }
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    if (allSuccessful) {
                        message.value = 'All entries added successfully!';
                        isError.value = false;
                        form.names = [];
                        form.date = getTodayDateEST();
                        form.loginTime = '';
                        form.logoutTime = '';
                        form.paid = false;
                        nameInput.value = '';
                        refreshAllData();
                        fetchUnpaidForAll();
                    }
                    else {
                        message.value = 'Some entries failed to add. Check console for details.';
                        isError.value = true;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var fetchUnpaidForAll = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _i, _a, worker, res, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                unpaidByWorker.value = {};
                _i = 0, _a = workers.value;
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 6];
                worker = _a[_i];
                console.log('Fetching unpaid for:', worker);
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, axios_1.default.get("".concat(API_BASE, "/attendance/unpaid?name=").concat(encodeURIComponent(worker)))];
            case 3:
                res = _b.sent();
                console.log("Response for ".concat(worker, ":"), res.data);
                unpaidByWorker.value[worker] = res.data.sort(function (a, b) {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                });
                return [3 /*break*/, 5];
            case 4:
                err_2 = _b.sent();
                console.error("Error fetching unpaid for ".concat(worker, ":"), err_2);
                unpaidByWorker.value[worker] = [];
                return [3 /*break*/, 5];
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/];
        }
    });
}); };
function deleteEntry(entryId) {
    return __awaiter(this, void 0, void 0, function () {
        var res, worker, entries, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Are you sure you want to delete this entry?'))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/delete_entry/").concat(entryId), {
                            method: 'DELETE'
                        })];
                case 2:
                    res = _a.sent();
                    refreshAllData();
                    fetchUnpaidForAll();
                    if (res.ok) {
                        // Find which worker has this entry
                        for (worker in unpaidByWorker.value) {
                            entries = unpaidByWorker.value[worker];
                            if (Array.isArray(entries)) {
                                unpaidByWorker.value[worker] = entries.filter(function (e) { return e.id !== entryId; });
                            }
                        }
                        element_plus_1.ElMessage.success('Entry deleted successfully');
                    }
                    else {
                        element_plus_1.ElMessage.error('Failed to delete entry');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    console.error(err_3);
                    element_plus_1.ElMessage.error('Error deleting entry');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// ===============================
// EDIT ATTENDANCE ENTRY
// ===============================
(0, vue_1.watch)(// 计算工时
function () { return [editForm.value.login_time, editForm.value.logout_time]; }, function (_a) {
    var loginTime = _a[0], logoutTime = _a[1];
    if (!loginTime || !logoutTime) {
        editForm.value.hours = 0;
        editForm.value.overtime_hours = 0;
        return;
    }
    var diffMs = logoutTime.getTime() - loginTime.getTime();
    if (diffMs <= 0) {
        editForm.value.hours = 0;
        editForm.value.overtime_hours = 0;
        return;
    }
    var diffHours = diffMs / (1000 * 60 * 60);
    var normalHours = Math.min(diffHours, 8);
    var overtime = Math.max(diffHours - 8, 0);
    editForm.value.hours = Math.round(normalHours * 2) / 2;
    editForm.value.overtime_hours = Math.round(overtime * 2) / 2;
});
(0, vue_1.watch)(function () { return [editForm.value.login_time, editForm.value.logout_time]; }, function (_a) {
    var newLogin = _a[0], newLogout = _a[1];
    var loginDate = toDate(newLogin);
    var logoutDate = toDate(newLogout);
    var _b = calculateHours(loginDate, logoutDate), hours = _b.hours, overtime_hours = _b.overtime_hours;
    editForm.value.hours = hours;
    editForm.value.overtime_hours = overtime_hours;
});
function saveEdit() {
    return __awaiter(this, void 0, void 0, function () {
        var payload, res, worker, idx, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    payload = __assign(__assign({}, editForm.value), { date: formatDate(editForm.value.date), login_time: formatTime(editForm.value.login_time), logout_time: formatTime(editForm.value.logout_time) });
                    console.log("".concat(API_BASE, "/update_entry/").concat(editForm.value.id));
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/update_entry/").concat(editForm.value.id), {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        })];
                case 1:
                    res = _a.sent();
                    if (res.ok) {
                        for (worker in unpaidByWorker.value) {
                            idx = unpaidByWorker.value[worker].findIndex(function (e) { return e.id === editForm.value.id; });
                            if (idx > -1)
                                unpaidByWorker.value[worker][idx] = __assign({}, payload);
                        }
                        element_plus_1.ElMessage.success('Entry updated successfully');
                        editDialogVisible.value = false;
                    }
                    else {
                        element_plus_1.ElMessage.error('Failed to update entry');
                    }
                    return [3 /*break*/, 3];
                case 2:
                    err_4 = _a.sent();
                    console.error(err_4);
                    element_plus_1.ElMessage.error('Error updating entry');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// 打开编辑时调用，确保时间字段是 Date 对象
function openEdit(data) {
    editForm.value = __assign({}, data);
    editForm.value.login_time = timeStrToDate(data.login_time);
    editForm.value.logout_time = timeStrToDate(data.logout_time);
    editDialogVisible.value = true;
}
// ===============================
// TABLE UTILITIES
// ===============================
function summaryMethod(_a) {
    var columns = _a.columns, data = _a.data;
    var sums = [];
    columns.forEach(function (column, index) {
        if (index === 0) {
            sums[index] = 'Total';
            return;
        }
        if (column.property === 'hours') {
            sums[index] = data.reduce(function (sum, row) { return sum + (row.hours || 0); }, 0).toFixed(1);
        }
        else if (column.property === 'overtime_hours') {
            sums[index] = data.reduce(function (sum, row) { return sum + (row.overtime_hours || 0); }, 0).toFixed(1);
        }
        else {
            sums[index] = '';
        }
    });
    return sums;
}
// ===============================
// LIFECYCLE HOOK
// ===============================
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, refreshAllData()]; // 先拿 workers 和年度数据
            case 1:
                _a.sent(); // 先拿 workers 和年度数据
                return [4 /*yield*/, fetchUnpaidForAll()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
var __VLS_ctx = {};
var __VLS_components;
var __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
var __VLS_0 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0(__assign(__assign({ 'onSubmit': {} }, { model: (__VLS_ctx.form), labelWidth: "120px" }), { style: {} })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { model: (__VLS_ctx.form), labelWidth: "120px" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_4;
var __VLS_5;
var __VLS_6;
var __VLS_7 = {
    onSubmit: (__VLS_ctx.submitEntry)
};
__VLS_3.slots.default;
var __VLS_8 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "Names",
}));
var __VLS_10 = __VLS_9.apply(void 0, __spreadArray([{
        label: "Names",
    }], __VLS_functionalComponentArgsRest(__VLS_9), false));
__VLS_11.slots.default;
var _loop_1 = function (n, index) {
    var __VLS_12 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12(__assign(__assign({ 'onClose': {} }, { key: (index), closable: true }), { style: {} })));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign(__assign({ 'onClose': {} }, { key: (index), closable: true }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_13), false));
    var __VLS_16 = void 0;
    var __VLS_17 = void 0;
    var __VLS_18 = void 0;
    var __VLS_19 = {
        onClose: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.form.names.splice(index, 1);
        }
    };
    __VLS_15.slots.default;
    (n);
};
var __VLS_15;
for (var _i = 0, _a = __VLS_getVForSourceType((__VLS_ctx.form.names)); _i < _a.length; _i++) {
    var _b = _a[_i], n = _b[0], index = _b[1];
    _loop_1(n, index);
}
var __VLS_20 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
var __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20(__assign(__assign(__assign({ 'onKeydown': {} }, { modelValue: (__VLS_ctx.nameInput), placeholder: "Type a name and press Enter" }), { style: {} }), { list: "worker-list" })));
var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onKeydown': {} }, { modelValue: (__VLS_ctx.nameInput), placeholder: "Type a name and press Enter" }), { style: {} }), { list: "worker-list" })], __VLS_functionalComponentArgsRest(__VLS_21), false));
var __VLS_24;
var __VLS_25;
var __VLS_26;
var __VLS_27 = {
    onKeydown: (__VLS_ctx.addName)
};
__VLS_23.slots.default;
{
    var __VLS_thisSlot = __VLS_23.slots.append;
    var __VLS_28 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28(__assign({ 'onClick': {} }, { type: "primary", size: "small" })));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { type: "primary", size: "small" })], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_32 = void 0;
    var __VLS_33 = void 0;
    var __VLS_34 = void 0;
    var __VLS_35 = {
        onClick: (__VLS_ctx.addName)
    };
    __VLS_31.slots.default;
    var __VLS_31;
}
var __VLS_23;
__VLS_asFunctionalElement(__VLS_intrinsicElements.datalist, __VLS_intrinsicElements.datalist)({
    id: "worker-list",
});
for (var _c = 0, _d = __VLS_getVForSourceType((__VLS_ctx.workers)); _c < _d.length; _c++) {
    var worker = _d[_c][0];
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option)({
        key: (worker),
        value: (worker),
    });
}
var __VLS_11;
var __VLS_36 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "Date",
    required: true,
}));
var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{
        label: "Date",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_37), false));
__VLS_39.slots.default;
var __VLS_40 = {}.ElDatePicker;
/** @type {[typeof __VLS_components.ElDatePicker, typeof __VLS_components.elDatePicker, ]} */ ;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40(__assign(__assign({ modelValue: (__VLS_ctx.form.date), type: "date", placeholder: "Select date" }, { style: {} }), { defaultValue: (__VLS_ctx.getTodayDateEST()) })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.form.date), type: "date", placeholder: "Select date" }, { style: {} }), { defaultValue: (__VLS_ctx.getTodayDateEST()) })], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_39;
var __VLS_44 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    label: "Login Time",
    required: true,
}));
var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([{
        label: "Login Time",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_45), false));
__VLS_47.slots.default;
var __VLS_48 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
var __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48(__assign({ modelValue: (__VLS_ctx.form.loginTime), placeholder: "Select login time" }, { style: {} })));
var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.form.loginTime), placeholder: "Select login time" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_49), false));
__VLS_51.slots.default;
for (var _e = 0, _f = __VLS_getVForSourceType((__VLS_ctx.timeOptions)); _e < _f.length; _e++) {
    var time = _f[_e][0];
    var __VLS_52 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    var __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        key: (time),
        label: (time),
        value: (time),
    }));
    var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([{
            key: (time),
            label: (time),
            value: (time),
        }], __VLS_functionalComponentArgsRest(__VLS_53), false));
}
var __VLS_51;
var __VLS_47;
var __VLS_56 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "Logout Time",
    required: true,
}));
var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
        label: "Logout Time",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_57), false));
__VLS_59.slots.default;
var __VLS_60 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
var __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60(__assign({ modelValue: (__VLS_ctx.form.logoutTime), placeholder: "Select logout time" }, { style: {} })));
var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.form.logoutTime), placeholder: "Select logout time" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_61), false));
__VLS_63.slots.default;
for (var _g = 0, _h = __VLS_getVForSourceType((__VLS_ctx.timeOptions)); _g < _h.length; _g++) {
    var time = _h[_g][0];
    var __VLS_64 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        key: (time),
        label: (time),
        value: (time),
    }));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
            key: (time),
            label: (time),
            value: (time),
        }], __VLS_functionalComponentArgsRest(__VLS_65), false));
}
var __VLS_63;
var __VLS_59;
var __VLS_68 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({}));
var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_69), false));
__VLS_71.slots.default;
var __VLS_72 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
var __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    type: "primary",
    nativeType: "submit",
}));
var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
        type: "primary",
        nativeType: "submit",
    }], __VLS_functionalComponentArgsRest(__VLS_73), false));
__VLS_75.slots.default;
var __VLS_75;
var __VLS_71;
var __VLS_3;
var _loop_2 = function (worker) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ key: (worker) }, { style: {} }));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (worker);
    var __VLS_76 = {}.ElTable;
    /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
    // @ts-ignore
    var __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76(__assign(__assign({ data: (__VLS_ctx.unpaidByWorker[worker] || []) }, { style: {} }), { border: true, showSummary: true, summaryMethod: (__VLS_ctx.summaryMethod) })));
    var __VLS_78 = __VLS_77.apply(void 0, __spreadArray([__assign(__assign({ data: (__VLS_ctx.unpaidByWorker[worker] || []) }, { style: {} }), { border: true, showSummary: true, summaryMethod: (__VLS_ctx.summaryMethod) })], __VLS_functionalComponentArgsRest(__VLS_77), false));
    __VLS_79.slots.default;
    var __VLS_80 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    var __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        prop: "date",
        label: "Date",
        width: "120",
    }));
    var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{
            prop: "date",
            label: "Date",
            width: "120",
        }], __VLS_functionalComponentArgsRest(__VLS_81), false));
    var __VLS_84 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    var __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        prop: "login_time",
        label: "Login Time",
        width: "120",
    }));
    var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{
            prop: "login_time",
            label: "Login Time",
            width: "120",
        }], __VLS_functionalComponentArgsRest(__VLS_85), false));
    var __VLS_88 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    var __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        prop: "logout_time",
        label: "Logout Time",
        width: "120",
    }));
    var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
            prop: "logout_time",
            label: "Logout Time",
            width: "120",
        }], __VLS_functionalComponentArgsRest(__VLS_89), false));
    var __VLS_92 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    var __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        prop: "hours",
        label: "Hours Worked",
        width: "140",
    }));
    var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
            prop: "hours",
            label: "Hours Worked",
            width: "140",
        }], __VLS_functionalComponentArgsRest(__VLS_93), false));
    var __VLS_96 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    var __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        prop: "overtime_hours",
        label: "Overtime Hours",
        width: "160",
    }));
    var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{
            prop: "overtime_hours",
            label: "Overtime Hours",
            width: "160",
        }], __VLS_functionalComponentArgsRest(__VLS_97), false));
    var __VLS_100 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    var __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        prop: "paid",
        label: "Paid",
        width: "100",
        formatter: (__VLS_ctx.paidFormatter),
    }));
    var __VLS_102 = __VLS_101.apply(void 0, __spreadArray([{
            prop: "paid",
            label: "Paid",
            width: "100",
            formatter: (__VLS_ctx.paidFormatter),
        }], __VLS_functionalComponentArgsRest(__VLS_101), false));
    var __VLS_104 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    var __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        label: "Actions",
        width: "160",
    }));
    var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
            label: "Actions",
            width: "160",
        }], __VLS_functionalComponentArgsRest(__VLS_105), false));
    __VLS_107.slots.default;
    {
        var __VLS_thisSlot = __VLS_107.slots.default;
        var row_1 = __VLS_getSlotParams(__VLS_thisSlot)[0].row;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)(__assign({ style: {} }));
        var __VLS_108 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        var __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108(__assign({ 'onClick': {} }, { type: "primary", size: "small" })));
        var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { type: "primary", size: "small" })], __VLS_functionalComponentArgsRest(__VLS_109), false));
        var __VLS_112 = void 0;
        var __VLS_113 = void 0;
        var __VLS_114 = void 0;
        var __VLS_115 = {
            onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openEdit(row_1);
            }
        };
        __VLS_111.slots.default;
        var __VLS_116 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        var __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116(__assign({ 'onClick': {} }, { type: "danger", size: "small" })));
        var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { type: "danger", size: "small" })], __VLS_functionalComponentArgsRest(__VLS_117), false));
        var __VLS_120 = void 0;
        var __VLS_121 = void 0;
        var __VLS_122 = void 0;
        var __VLS_123 = {
            onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.deleteEntry(row_1.id);
            }
        };
        __VLS_119.slots.default;
    }
};
var __VLS_111, __VLS_119, __VLS_107, __VLS_79;
for (var _j = 0, _k = __VLS_getVForSourceType((__VLS_ctx.workers)); _j < _k.length; _j++) {
    var worker = _k[_j][0];
    _loop_2(worker);
}
var __VLS_124 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
var __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
    modelValue: (__VLS_ctx.editDialogVisible),
    title: "Edit Attendance Entry",
    width: "500px",
}));
var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.editDialogVisible),
        title: "Edit Attendance Entry",
        width: "500px",
    }], __VLS_functionalComponentArgsRest(__VLS_125), false));
__VLS_127.slots.default;
var __VLS_128 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
var __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    model: (__VLS_ctx.editForm),
    labelWidth: "140px",
}));
var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([{
        model: (__VLS_ctx.editForm),
        labelWidth: "140px",
    }], __VLS_functionalComponentArgsRest(__VLS_129), false));
__VLS_131.slots.default;
var __VLS_132 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    label: "Date",
}));
var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([{
        label: "Date",
    }], __VLS_functionalComponentArgsRest(__VLS_133), false));
__VLS_135.slots.default;
var __VLS_136 = {}.ElDatePicker;
/** @type {[typeof __VLS_components.ElDatePicker, typeof __VLS_components.elDatePicker, ]} */ ;
// @ts-ignore
var __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136(__assign({ modelValue: (__VLS_ctx.editForm.date), type: "date", format: "YYYY-MM-DD" }, { style: {} })));
var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.date), type: "date", format: "YYYY-MM-DD" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_137), false));
var __VLS_135;
var __VLS_140 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    label: "Login Time",
}));
var __VLS_142 = __VLS_141.apply(void 0, __spreadArray([{
        label: "Login Time",
    }], __VLS_functionalComponentArgsRest(__VLS_141), false));
__VLS_143.slots.default;
var __VLS_144 = {}.ElTimePicker;
/** @type {[typeof __VLS_components.ElTimePicker, typeof __VLS_components.elTimePicker, ]} */ ;
// @ts-ignore
var __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144(__assign({ modelValue: (__VLS_ctx.editForm.login_time), format: "HH:mm" }, { style: {} })));
var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.login_time), format: "HH:mm" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_145), false));
var __VLS_143;
var __VLS_148 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    label: "Logout Time",
}));
var __VLS_150 = __VLS_149.apply(void 0, __spreadArray([{
        label: "Logout Time",
    }], __VLS_functionalComponentArgsRest(__VLS_149), false));
__VLS_151.slots.default;
var __VLS_152 = {}.ElTimePicker;
/** @type {[typeof __VLS_components.ElTimePicker, typeof __VLS_components.elTimePicker, ]} */ ;
// @ts-ignore
var __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152(__assign({ modelValue: (__VLS_ctx.editForm.logout_time), format: "HH:mm" }, { style: {} })));
var __VLS_154 = __VLS_153.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.logout_time), format: "HH:mm" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_153), false));
var __VLS_151;
var __VLS_156 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    label: "Hours Worked",
}));
var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([{
        label: "Hours Worked",
    }], __VLS_functionalComponentArgsRest(__VLS_157), false));
__VLS_159.slots.default;
var __VLS_160 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
var __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160(__assign({ modelValue: (__VLS_ctx.editForm.hours), min: (0), step: (0.5) }, { style: {} })));
var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.hours), min: (0), step: (0.5) }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_161), false));
var __VLS_159;
var __VLS_164 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    label: "Overtime Hours",
}));
var __VLS_166 = __VLS_165.apply(void 0, __spreadArray([{
        label: "Overtime Hours",
    }], __VLS_functionalComponentArgsRest(__VLS_165), false));
__VLS_167.slots.default;
var __VLS_168 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
var __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168(__assign({ modelValue: (__VLS_ctx.editForm.overtime_hours), min: (0), step: (0.5) }, { style: {} })));
var __VLS_170 = __VLS_169.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.overtime_hours), min: (0), step: (0.5) }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_169), false));
var __VLS_167;
var __VLS_172 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    label: "Paid",
}));
var __VLS_174 = __VLS_173.apply(void 0, __spreadArray([{
        label: "Paid",
    }], __VLS_functionalComponentArgsRest(__VLS_173), false));
__VLS_175.slots.default;
var __VLS_176 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
var __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    modelValue: (__VLS_ctx.editForm.paid),
}));
var __VLS_178 = __VLS_177.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.editForm.paid),
    }], __VLS_functionalComponentArgsRest(__VLS_177), false));
var __VLS_175;
var __VLS_131;
{
    var __VLS_thisSlot = __VLS_127.slots.footer;
    var __VLS_180 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    var __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180(__assign({ 'onClick': {} })));
    var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([__assign({ 'onClick': {} })], __VLS_functionalComponentArgsRest(__VLS_181), false));
    var __VLS_184 = void 0;
    var __VLS_185 = void 0;
    var __VLS_186 = void 0;
    var __VLS_187 = {
        onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.editDialogVisible = false;
        }
    };
    __VLS_183.slots.default;
    var __VLS_183;
    var __VLS_188 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    var __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188(__assign({ 'onClick': {} }, { type: "primary" })));
    var __VLS_190 = __VLS_189.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { type: "primary" })], __VLS_functionalComponentArgsRest(__VLS_189), false));
    var __VLS_192 = void 0;
    var __VLS_193 = void 0;
    var __VLS_194 = void 0;
    var __VLS_195 = {
        onClick: (__VLS_ctx.saveEdit)
    };
    __VLS_191.slots.default;
    var __VLS_191;
}
var __VLS_127;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
var __VLS_196 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
var __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    modelValue: (__VLS_ctx.editDialogVisible),
    title: "Edit Attendance Entry",
    width: "500px",
}));
var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.editDialogVisible),
        title: "Edit Attendance Entry",
        width: "500px",
    }], __VLS_functionalComponentArgsRest(__VLS_197), false));
__VLS_199.slots.default;
var __VLS_200 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
var __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
    model: (__VLS_ctx.editForm),
    labelWidth: "140px",
}));
var __VLS_202 = __VLS_201.apply(void 0, __spreadArray([{
        model: (__VLS_ctx.editForm),
        labelWidth: "140px",
    }], __VLS_functionalComponentArgsRest(__VLS_201), false));
__VLS_203.slots.default;
var __VLS_204 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    label: "Date",
}));
var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{
        label: "Date",
    }], __VLS_functionalComponentArgsRest(__VLS_205), false));
__VLS_207.slots.default;
var __VLS_208 = {}.ElDatePicker;
/** @type {[typeof __VLS_components.ElDatePicker, typeof __VLS_components.elDatePicker, ]} */ ;
// @ts-ignore
var __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208(__assign({ modelValue: (__VLS_ctx.editForm.date), type: "date", format: "YYYY-MM-DD" }, { style: {} })));
var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.date), type: "date", format: "YYYY-MM-DD" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_209), false));
var __VLS_207;
var __VLS_212 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    label: "Login Time",
}));
var __VLS_214 = __VLS_213.apply(void 0, __spreadArray([{
        label: "Login Time",
    }], __VLS_functionalComponentArgsRest(__VLS_213), false));
__VLS_215.slots.default;
var __VLS_216 = {}.ElTimePicker;
/** @type {[typeof __VLS_components.ElTimePicker, typeof __VLS_components.elTimePicker, ]} */ ;
// @ts-ignore
var __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216(__assign({ modelValue: (__VLS_ctx.editForm.login_time), format: "HH:mm" }, { style: {} })));
var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.login_time), format: "HH:mm" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_217), false));
var __VLS_215;
var __VLS_220 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
    label: "Logout Time",
}));
var __VLS_222 = __VLS_221.apply(void 0, __spreadArray([{
        label: "Logout Time",
    }], __VLS_functionalComponentArgsRest(__VLS_221), false));
__VLS_223.slots.default;
var __VLS_224 = {}.ElTimePicker;
/** @type {[typeof __VLS_components.ElTimePicker, typeof __VLS_components.elTimePicker, ]} */ ;
// @ts-ignore
var __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224(__assign({ modelValue: (__VLS_ctx.editForm.logout_time), format: "HH:mm" }, { style: {} })));
var __VLS_226 = __VLS_225.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.logout_time), format: "HH:mm" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_225), false));
var __VLS_223;
var __VLS_228 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
    label: "Hours Worked",
}));
var __VLS_230 = __VLS_229.apply(void 0, __spreadArray([{
        label: "Hours Worked",
    }], __VLS_functionalComponentArgsRest(__VLS_229), false));
__VLS_231.slots.default;
var __VLS_232 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
var __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232(__assign({ modelValue: (__VLS_ctx.editForm.hours), min: (0), step: (0.5) }, { style: {} })));
var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.hours), min: (0), step: (0.5) }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_233), false));
var __VLS_231;
var __VLS_236 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
    label: "Overtime Hours",
}));
var __VLS_238 = __VLS_237.apply(void 0, __spreadArray([{
        label: "Overtime Hours",
    }], __VLS_functionalComponentArgsRest(__VLS_237), false));
__VLS_239.slots.default;
var __VLS_240 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
var __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240(__assign({ modelValue: (__VLS_ctx.editForm.overtime_hours), min: (0), step: (0.5) }, { style: {} })));
var __VLS_242 = __VLS_241.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.editForm.overtime_hours), min: (0), step: (0.5) }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_241), false));
var __VLS_239;
var __VLS_244 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
var __VLS_245 = __VLS_asFunctionalComponent(__VLS_244, new __VLS_244({
    label: "Paid",
}));
var __VLS_246 = __VLS_245.apply(void 0, __spreadArray([{
        label: "Paid",
    }], __VLS_functionalComponentArgsRest(__VLS_245), false));
__VLS_247.slots.default;
var __VLS_248 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
var __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
    modelValue: (__VLS_ctx.editForm.paid),
}));
var __VLS_250 = __VLS_249.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.editForm.paid),
    }], __VLS_functionalComponentArgsRest(__VLS_249), false));
var __VLS_247;
var __VLS_203;
{
    var __VLS_thisSlot = __VLS_199.slots.footer;
    var __VLS_252 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    var __VLS_253 = __VLS_asFunctionalComponent(__VLS_252, new __VLS_252(__assign({ 'onClick': {} })));
    var __VLS_254 = __VLS_253.apply(void 0, __spreadArray([__assign({ 'onClick': {} })], __VLS_functionalComponentArgsRest(__VLS_253), false));
    var __VLS_256 = void 0;
    var __VLS_257 = void 0;
    var __VLS_258 = void 0;
    var __VLS_259 = {
        onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.editDialogVisible = false;
        }
    };
    __VLS_255.slots.default;
    var __VLS_255;
    var __VLS_260 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    var __VLS_261 = __VLS_asFunctionalComponent(__VLS_260, new __VLS_260(__assign({ 'onClick': {} }, { type: "primary" })));
    var __VLS_262 = __VLS_261.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { type: "primary" })], __VLS_functionalComponentArgsRest(__VLS_261), false));
    var __VLS_264 = void 0;
    var __VLS_265 = void 0;
    var __VLS_266 = void 0;
    var __VLS_267 = {
        onClick: (__VLS_ctx.saveEdit)
    };
    __VLS_263.slots.default;
    var __VLS_263;
}
var __VLS_199;
var __VLS_dollars;
var __VLS_self = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {
            timeOptions: timeOptions,
            workers: workers,
            unpaidByWorker: unpaidByWorker,
            form: form,
            nameInput: nameInput,
            editDialogVisible: editDialogVisible,
            editForm: editForm,
            paidFormatter: paidFormatter,
            getTodayDateEST: getTodayDateEST,
            addName: addName,
            submitEntry: submitEntry,
            deleteEntry: deleteEntry,
            saveEdit: saveEdit,
            openEdit: openEdit,
            summaryMethod: summaryMethod,
        };
    },
});
exports.default = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
