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
class PostModel {
    insertSeveral(posts, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = [];
            for (let i = 0; i < posts.length; i++) {
                const p = posts[i];
                values.push(`('${data.forum}', 
                        '${p.author}', 
                        ${data.threadId},
                        ${p.parent === undefined ? `NULL, '{}'` :
                    `${p.parent}, (SELECT path FROM post WHERE pid = ${p.parent}) || ${p.parent}`},
                        '${p.message}'
                    )`);
            }
            const query = {
                name: '',
                text: `
                INSERT INTO 
                    post(forum, author, thread, parent_id, path, message)
                VALUES ${values.join(',')}
                RETURNING 
                    pid as id,
                    created
            `,
                values: []
            };
            return database_1.default.sendQuery(query);
        });
    }
    getThreadPosts(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            let sinceExpr = '';
            const compSym = filter.desc ? '<' : '>';
            const desc = filter.desc ? 'DESC' : 'ASC';
            if (filter.since) {
                switch (filter.sort) {
                    case 'tree':
                        {
                            sinceExpr = `
                        AND path ${compSym} (
                            SELECT path FROM post
                            WHERE pid = ${filter.since}
                        )
                    `;
                        }
                        break;
                    case 'parent_tree':
                        {
                            sinceExpr = `
                        AND path ${compSym} (
                            SELECT path ${filter.desc ? '[1:1]' : ''}  FROM post
                            WHERE pid = ${filter.since}
                        )
                    `;
                        }
                        break;
                    default: {
                        sinceExpr = `AND pid ${compSym} '${filter.since}'`;
                    }
                }
            }
            const limit = `LIMIT $2`;
            const where = `WHERE thread = $1`;
            let select = `
                SELECT 
                    author,
                    created,  
                    forum,
                    pid as id,  
                    is_edited as "isEdited", 
                    message, 
                    COALESCE(parent_id, 0) as parent,
                    thread
                FROM post 
            `;
            switch (filter.sort) {
                case 'tree':
                    {
                        select += `
                    ${where}
                    ${sinceExpr}   
                    ORDER BY path ${desc}
                    ${limit}
                `;
                    }
                    break;
                case 'parent_tree':
                    {
                        select = `
                    WITH parents AS (
                        SELECT pid as id FROM post 
                        ${where}
                        AND parent_id IS NULL
                        ${sinceExpr}
                        ORDER BY id ${desc}
                        ${limit}
                    )
                ` + select + `
                    WHERE root IN (SELECT id FROM parents)
                    ORDER BY root ${desc}, path
                `;
                    }
                    break;
                default: {
                    select += `
                    ${where}
                    ${sinceExpr}   
                    ORDER BY created ${desc}, pid ${desc} 
                    ${limit}
                `;
                }
            }
            const query = {
                name: '',
                text: select,
                values: [filter.threadId, filter.limit]
            };
            return database_1.default.sendQuery(query);
        });
    }
    update(post) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'update_post',
                text: `
                    SELECT author, created, forum, id, is_edited as "isEdited", message, parent, thread
                    FROM update_post($1, $2)
                  `,
                values: [post.message, post.id]
            };
            return database_1.default.sendQuery(query);
        });
    }
    fullData(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_post_full',
                text: `SELECT get_post_full($1) as post`,
                values: [id]
            };
            return database_1.default.sendQuery(query);
        });
    }
}
exports.default = new PostModel();
