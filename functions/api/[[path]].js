// functions/api/[[path]].js

/**
 * API 路由处理器
 * @param {EventContext<Env, any, any>} context
 */
export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const pathSegments = params.path || [];
    const apiRoute = pathSegments[0]; // e.g., 'get-data', 'admin-login'

    // 设置通用的CORS和缓存头
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 仅用于开发，生产环境建议更严格
    };

    try {
        // --- 新增路由：管理员登录 ---
        if (apiRoute === 'admin-login' && request.method === 'POST') {
            const { username, password } = await request.json();

            // 从环境变量中获取正确的用户名和密码
            const correctUsername = env.ADMIN_USERNAME;
            const correctPassword = env.ADMIN_PASSWORD;

            if (!correctUsername || !correctPassword) {
                 return new Response(JSON.stringify({ success: false, message: '管理员凭据未在服务器端配置' }), {
                    status: 500,
                    headers: headers
                });
            }

            if (username === correctUsername && password === correctPassword) {
                // 登录成功
                return new Response(JSON.stringify({ success: true }), { headers });
            } else {
                // 登录失败
                return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), {
                    status: 401, // 401 Unauthorized
                    headers: headers
                });
            }
        }


        // --- 路由：获取所有文章数据 ---
        if (apiRoute === 'get-data' && request.method === 'GET') {
            const list = await env.OJBK_STORE.list({ prefix: 'post:' });
            const posts = await Promise.all(
                list.keys.map(async (key) => {
                    const value = await env.OJBK_STORE.get(key.name);
                    return value ? { key: key.name.split(':')[1], value: JSON.parse(value) } : null;
                })
            );
            return new Response(JSON.stringify(posts.filter(Boolean)), { headers });
        }

        // --- 路由：获取单篇文章 ---
        if (apiRoute === 'get-article' && pathSegments.length > 1 && request.method === 'GET') {
            const articleId = pathSegments[1];
            const key = `post:${articleId}`;
            const value = await env.OJBK_STORE.get(key);
            if (value === null) {
                return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers });
            }
            return new Response(JSON.stringify({ key: articleId, value: JSON.parse(value) }), { headers });
        }

        // --- 路由：获取导航菜单 ---
        if (apiRoute === 'nav' && pathSegments[1] === 'get' && request.method === 'GET') {
            const value = await env.OJBK_STORE.get('config:nav');
            return new Response(value || '[]', { headers });
        }
        
        // --- 路由：获取网站设置 ---
        if (apiRoute === 'website-settings' && pathSegments[1] === 'get' && request.method === 'GET') {
            const value = await env.OJBK_STORE.get('config:website-settings');
            return new Response(value || '{}', { headers });
        }

        // --- 路由：获取轮播图 ---
        if (apiRoute === 'carousel' && pathSegments[1] === 'get' && request.method === 'GET') {
            const value = await env.OJBK_STORE.get('config:carousel');
            return new Response(value || '[]', { headers });
        }

        // --- 路由：获取友情链接 ---
        if (apiRoute === 'links' && pathSegments[1] === 'get' && request.method === 'GET') {
            const value = await env.OJBK_STORE.get('config:links');
            return new Response(value || '[]', { headers });
        }


        // --- 路由：提交评论 ---
        if (apiRoute === 'submit-comment' && request.method === 'POST') {
            const commentData = await request.json();

            if (!commentData.articleId || !commentData.author || !commentData.comment || !commentData.email) {
                return new Response(JSON.stringify({ success: false, message: 'Missing required fields.' }), {
                    status: 400,
                    headers: headers
                });
            }
            
            const commentId = new Date().toISOString();
            const key = `comment:${commentData.articleId}:${commentId}`;
            
            const value = JSON.stringify({
                author: commentData.author,
                email: commentData.email,
                comment: commentData.comment,
                timestamp: Date.now()
            });

            await env.OJBK_STORE.put(key, value);

            return new Response(JSON.stringify({ success: true }), {
                headers: headers
            });
        }

        // 如果没有匹配的路由，返回JSON格式的错误
        return new Response(JSON.stringify({ error: 'API route not found.' }), { 
            status: 404,
            headers: headers
        });

    } catch (error) {
        console.error(`API Error on path /api/${pathSegments.join('/')}:`, error);
        // 内部服务器错误也返回JSON格式
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500,
            headers: headers
        });
    }
}
