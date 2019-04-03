"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../../config/database"));
class ServiceModel {
    getTablesStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_tables_status',
                text: `
                  SELECT
                        json_build_object(
                            'forum', (SELECT COUNT(*) FROM forum),
                            'user', (SELECT COUNT(*) FROM public."user"),
                            'thread', (SELECT COUNT(*) FROM thread),
                            'post', (SELECT COUNT(*) FROM post)
                        )
                  as status
                `,
                values: []
            };
            return database_1.default.sendQuery(query);
        });
    }
    truncateTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'clear_tables',
                text: `
                TRUNCATE TABLE public."user", post, thread, forum CASCADE
            `,
                values: []
            };
            return database_1.default.sendQuery(query);
        });
    }
}
exports.default = new ServiceModel();
