// functions/api/[[path]].js

/**
 * API 路由处理器
 * @param {EventContext<Env, any, any>} context
 */
export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const pathSegments = params.path || [];
    
    // 将路径片段连接成一个完整的API路径，例如 'admin/login'
    const fullApiRoute = pathSegments.join('/'); 

    // 设置通用的CORS和缓存头
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // 仅用于开发，生产环境建议更严格
    };

    try {
        // --- 修正后的路由：管理员登录 ---
        // 现在会正确匹配 'admin/login'
        if (fullApiRoute === 'admin/login' && request.method === 'POST') {
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
                return new Response(JSON.stringify({ success: true, message: '登录成功' }), { headers });
            } else {
                // 登录失败
                return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), {
                    status: 401, // 401 Unauthorized
                    headers: headers
                });
            }
        }


        // --- 路由：获取所有文章数据 ---
        if (fullApiRoute === 'get-data' && request.method === 'GET') {
            const list = await env.DB.list({ prefix: 'post:' });
            const posts = await Promise.all(
                list.keys.map(async (key) => {
                    const value = await env.DB.get(key.name);
                    return value ? { key: key.name.split(':')[1], value: JSON.parse(value) } : null;
                })
            );
            return new Response(JSON.stringify(posts.filter(Boolean)), { headers });
        }

        // --- 路由：获取单篇文章 ---
        if (fullApiRoute.startsWith('get-article/') && pathSegments.length === 2 && request.method === 'GET') {
            const articleId = pathSegments[1];
            const key = `post:${articleId}`;
            const value = await env.DB.get(key);
            if (value === null) {
                return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers });
            }
            return new Response(JSON.stringify({ key: articleId, value: JSON.parse(value) }), { headers });
        }

        // --- 路由：获取导航菜单 ---
        if (fullApiRoute === 'nav/get' && request.method === 'GET') {
            const value = await env.DB.get('config:nav');
            return new Response(value || '[]', { headers });
        }
        
        // --- 路由：获取网站设置 ---
        if (fullApiRoute === 'website-settings/get' && request.method === 'GET') {
            const value = await env.DB.get('config:website-settings');
            return new Response(value || '{}', { headers });
        }

        // --- 路由：获取轮播图 ---
        if (fullApiRoute === 'carousel/get' && request.method === 'GET') {
            const value = await env.DB.get('config:carousel');
            return new Response(value || '[]', { headers });
        }

        // --- 路由：获取友情链接 ---
        if (fullApiRoute === 'links/get' && request.method === 'GET') {
            const value = await env.DB.get('config:links');
            return new Response(value || '[]', { headers });
        }


        // --- 路由：提交评论 ---
        if (fullApiRoute === 'submit-comment' && request.method === 'POST') {
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

            await env.DB.put(key, value);

            return new Response(JSON.stringify({ success: true }), {
                headers: headers
            });
        }

        // 如果没有匹配的路由，返回JSON格式的错误
        return new Response(JSON.stringify({ error: 'API route not found.', requestedRoute: fullApiRoute }), { 
            status: 404,
            headers: headers
        });

    } catch (error) {
        console.error(`API Error on path /api/${fullApiRoute}:`, error);
        // 内部服务器错误也返回JSON格式
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
            status: 500,
            headers: headers
        });
    }
}
