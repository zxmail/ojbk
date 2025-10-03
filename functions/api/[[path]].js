// functions/api/[[path]].js

/**
 * 权限验证中间件
 * @param {Request} request
 * @param {Env} env
 * @returns {boolean} - true if authorized, false otherwise
 */
function isAuthorized(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return false;
    }
    
    try {
        const encoded = authHeader.startsWith('Basic ') ? authHeader.substring(6) : authHeader;
        const decoded = atob(encoded);
        const [username, password] = decoded.split(':');
        
        const correctUsername = env.ADMIN_USERNAME;
        const correctPassword = env.ADMIN_PASSWORD;

        return username === correctUsername && password === correctPassword;
    } catch (e) {
        console.error("Auth decoding failed:", e);
        return false;
    }
}


/**
 * API 路由处理器
 * @param {EventContext<Env, any, any>} context
 */
export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const pathSegments = params.path || [];
    const fullApiRoute = pathSegments.join('/');

    // --- 核心修改：在这里为所有JSON响应指定UTF-8编码 ---
    const headers = {
        'Content-Type': 'application/json;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        // ... (文件的其余部分代码保持不变) ...

        // --- 公开路由 (不需要登录) ---

        if (fullApiRoute === 'admin/login' && request.method === 'POST') {
             const { username, password } = await request.json();
             const correctUsername = env.ADMIN_USERNAME;
             const correctPassword = env.ADMIN_PASSWORD;

             if (!correctUsername || !correctPassword) {
                 return new Response(JSON.stringify({ success: false, message: '管理员凭据未在服务器端配置' }), { status: 500, headers });
             }
             if (username === correctUsername && password === correctPassword) {
                 return new Response(JSON.stringify({ success: true }), { headers });
             } else {
                 return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), { status: 401, headers });
             }
        }
        
        const publicGetRoutes = ['get-data', 'posts', 'website-settings/get', 'nav/get', 'carousel/get', 'links/get'];
        if (publicGetRoutes.includes(fullApiRoute) && request.method === 'GET') {
            // ... (此处省略部分重复代码)
            // ... (这部分逻辑保持不变)
            let allPosts = [];
            if(fullApiRoute === 'get-data' || fullApiRoute === 'posts'){
                const categoryName = url.searchParams.get('category');
                const list = await env.DB.list({ prefix: 'post:' });
                let posts = await Promise.all(list.keys.map(async (k) => {
                    const value = await env.DB.get(k.name);
                    return value ? { key: k.name.split(':')[1], value: JSON.parse(value) } : null;
                }));
                posts = posts.filter(Boolean);

                if (!categoryName || fullApiRoute === 'get-data') {
                    return new Response(JSON.stringify(posts), { headers });
                }

                const navConfigRaw = await env.DB.get('config:nav');
                const navConfig = navConfigRaw ? JSON.parse(navConfigRaw) : [];
                const childCategories = new Set([categoryName]);
                let targetLevel = (categoryName.match(/^-+/) || [''])[0].length;
                let startIndex = navConfig.findIndex(item => item.name === categoryName);
                if (startIndex !== -1) {
                    for (let i = startIndex + 1; i < navConfig.length; i++) {
                        const currentItem = navConfig[i];
                        const currentLevel = (currentItem.name.match(/^-+/) || [''])[0].length;
                        if (currentLevel > targetLevel) {
                            childCategories.add(currentItem.name);
                        } else {
                            break;
                        }
                    }
                }
                const filteredPosts = posts.filter(post => childCategories.has(post.value.category));
                return new Response(JSON.stringify(filteredPosts), { headers });
            }

            let key;
            if (fullApiRoute === 'website-settings/get') key = 'config:website-settings';
            if (fullApiRoute === 'nav/get') key = 'config:nav';
            if (fullApiRoute === 'carousel/get') key = 'config:carousel';
            if (fullApiRoute === 'links/get') key = 'config:links';
            
            if (key) {
                const value = await env.DB.get(key);
                return new Response(value || (key.includes('settings') ? '{}' : '[]'), { headers });
            }
        }
        
        // ... (文件的其余部分代码保持不变) ...

        if (fullApiRoute.startsWith('get-article/') && pathSegments.length === 2 && request.method === 'GET') {
            const articleId = pathSegments[1];
            const key = `post:${articleId}`;
            const value = await env.DB.get(key);
            if (value === null) return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers });
            return new Response(JSON.stringify({ key: articleId, value: JSON.parse(value) }), { headers });
        }

        if (fullApiRoute === 'submit-comment' && request.method === 'POST') {
             const commentData = await request.json();
             if (!commentData.articleId || !commentData.author || !commentData.comment || !commentData.email) {
                 return new Response(JSON.stringify({ success: false, message: 'Missing required fields.' }), { status: 400, headers });
             }
             const commentId = new Date().toISOString();
             const key = `comment:${commentData.articleId}:${commentId}`;
             const value = JSON.stringify({ author: commentData.author, email: commentData.email, comment: commentData.comment, timestamp: Date.now() });
             await env.DB.put(key, value);
             return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (!isAuthorized(request, env)) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
        }

        if (request.method === 'POST') {
            const data = await request.json();
            let key;
            if (fullApiRoute === 'website-settings/save') key = 'config:website-settings';
            if (fullApiRoute === 'nav/save') key = 'config:nav';
            if (fullApiRoute === 'carousel/save') key = 'config:carousel';
            if (fullApiRoute === 'links/save') key = 'config:links';
            
            if (key) {
                await env.DB.put(key, JSON.stringify(data));
                return new Response(JSON.stringify({ success: true }), { headers });
            }

            if (fullApiRoute === 'article/submit') {
                const postKey = data.key || Date.now().toString();
                await env.DB.put(`post:${postKey}`, JSON.stringify(data));
                return new Response(JSON.stringify({ success: true, key: postKey }), { headers });
            }

            if (fullApiRoute === 'article/delete') {
                await env.DB.delete(`post:${data.key}`);
                return new Response(JSON.stringify({ success: true }), { headers });
            }
            
            if (fullApiRoute === 'comments/delete') {
                await env.DB.delete(data.id);
                return new Response(JSON.stringify({ success: true }), { headers });
            }
            
            if (fullApiRoute === 'comments/update') {
                 const storedCommentRaw = await env.DB.get(data.id);
                 if(storedCommentRaw) {
                     const storedComment = JSON.parse(storedCommentRaw);
                     storedComment.comment = data.content;
                     await env.DB.put(data.id, JSON.stringify(storedComment));
                     return new Response(JSON.stringify({ success: true }), { headers });
                 }
                 return new Response(JSON.stringify({ success: false, message: 'Comment not found' }), { status: 404, headers });
            }
        }
        
        if (fullApiRoute === 'comments/get' && request.method === 'GET') {
             const list = await env.DB.list({ prefix: 'comment:' });
             const comments = await Promise.all(list.keys.map(async (k) => {
                 const value = await env.DB.get(k.name);
                 if (!value) return null;
                 const data = JSON.parse(value);
                 return {
                     id: k.name,
                     content: data.comment,
                     author: data.author,
                     articleId: k.name.split(':')[1],
                     date: data.timestamp
                 };
             }));
             return new Response(JSON.stringify(comments.filter(Boolean)), { headers });
        }

        return new Response(JSON.stringify({ error: 'API route not found.', requestedRoute: fullApiRoute }), { status: 404, headers });

    } catch (error) {
        console.error(`API Error on path /api/${fullApiRoute}:`, error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), { status: 500, headers });
    }
}
