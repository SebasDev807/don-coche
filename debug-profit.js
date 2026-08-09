"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var startOfDay, endOfDay, todaysOrders, totalSales, totalCost, _i, todaysOrders_1, order, orderSales, orderCost, _a, _b, orderProduct, productCost, _c, _d, orderService, serviceCost, totalProfit, averageMargin;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    endOfDay = new Date();
                    endOfDay.setHours(23, 59, 59, 999);
                    return [4 /*yield*/, prisma.order.findMany({
                            where: {
                                status: 'FACTURADA',
                                billedAt: {
                                    gte: startOfDay,
                                    lte: endOfDay,
                                },
                            },
                            include: {
                                products: {
                                    include: { product: true }
                                },
                                services: {
                                    include: { service: true }
                                }
                            }
                        })];
                case 1:
                    todaysOrders = _e.sent();
                    totalSales = 0;
                    totalCost = 0;
                    for (_i = 0, todaysOrders_1 = todaysOrders; _i < todaysOrders_1.length; _i++) {
                        order = todaysOrders_1[_i];
                        orderSales = Number(order.grandTotal);
                        orderCost = 0;
                        console.log("Order ".concat(order.id, " | GrandTotal: ").concat(orderSales));
                        for (_a = 0, _b = order.products; _a < _b.length; _a++) {
                            orderProduct = _b[_a];
                            productCost = Number(orderProduct.unitCost) * orderProduct.quantity;
                            orderCost += productCost;
                            console.log("  Product ".concat(orderProduct.product.name, " | Qty: ").concat(orderProduct.quantity, " | UnitCost: ").concat(orderProduct.unitCost, " | TotalCost: ").concat(productCost));
                        }
                        for (_c = 0, _d = order.services; _c < _d.length; _c++) {
                            orderService = _d[_c];
                            serviceCost = Number(orderService.service.basePrice);
                            orderCost += serviceCost;
                            console.log("  Service ".concat(orderService.service.name, " | BasePrice (Cost): ").concat(serviceCost, " | ChargedPrice (Revenue): ").concat(orderService.chargedPrice));
                        }
                        console.log("  -> Order Sales: ".concat(orderSales, ", Order Cost: ").concat(orderCost));
                        totalSales += orderSales;
                        totalCost += orderCost;
                    }
                    totalProfit = totalSales - totalCost;
                    averageMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
                    console.log("\n================================");
                    console.log("Total Sales: ".concat(totalSales));
                    console.log("Total Cost: ".concat(totalCost));
                    console.log("Total Profit: ".concat(totalProfit));
                    console.log("Average Margin: ".concat(averageMargin, "%"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) { return console.error(e); })
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
