import e from 'express';
import model  from './model';
import { IPost, IPostFilter, IPostUpdate } from './interface';
import { IError } from '../base/interfaces';
import { IThreadData } from '../thread/interface';

class PostController {
    create = async (req: e.Request, res: e.Response, data: IThreadData) => {
        const posts: IPost[] = req.body;
        if (!posts.length) {
            res.status(201).json([]);
            return;
        }

        const rq = await model.insertSeveral(posts, data);
        if (rq.isError) {
            if (rq.message.includes('author')) {
                res.status(404).json(<IError>{ message: `Author not found` });
            } else {
                res.status(409).json(<IError>{ message: rq.message });
            }
            return;
        }

        for (let i=0; i < posts.length; i++) {
            const p = rq.data.rows[i];
            posts[i].forum = data.forum;
            posts[i].thread = data.threadId;
            posts[i].created = p.created;
            posts[i].id = p.id;
        }

        res.status(201).json(posts);
    };

    threadPosts = async (req: e.Request, res: e.Response, data: IThreadData) => {
        const filter: IPostFilter = {
            threadId: data.threadId,
            forum: data.forum.toString(),
            limit: req.query.limit,
            since: req.query.since,
            sort: req.query.sort,
            desc: req.query.desc ? JSON.parse(req.query.desc): req.query.desc
        };

        const rq = await model.getThreadPosts(filter);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        res.json(rq.data.rows);
    };

    details = async (req: e.Request, res: e.Response) => {
        const id = req.params.id;
        const related = req.query.related || '';

        const rq = await model.fullData(id);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        if (!rq.data.rowCount) {
            res.status(404).json(<IError>{ message: `Post by id ${id} not found` });
            return;
        }

        const postFull = rq.data.rows[0].post;
        if (!related.includes('user')) delete postFull['author'];
        if (!related.includes('forum')) delete postFull['forum'];
        if (!related.includes('thread')) delete postFull['thread'];

        res.json(postFull);
    };

    update = async (req: e.Request, res: e.Response) => {
        const post: IPostUpdate = {
            id: req.params.id,
            message: req.body.message
        };

        const rq = await model.update(post);
        if (rq.isError) {
            res.status(400).json(<IError>{ message: rq.message });
            return;
        }

        if (!rq.data.rowCount) {
            res.status(404).json(<IError>{ message: `Post by id ${post.id} not found` });
            return;
        }

        const upPost = rq.data.rows[0];
        if (!upPost.parent) delete upPost['parent'];
        if (!upPost.isEdited) delete upPost['isEdited'];
        res.json(upPost);
    };
}

export default new PostController();
