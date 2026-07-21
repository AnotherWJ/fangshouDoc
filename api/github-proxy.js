export default async function handler(req) {
  // 修复点：req.url 是相对路径，手动补全基础url
  const baseUrl = "https://localhost";
  const fullUrl = new URL(req.url, baseUrl);
  const { method } = req;
  const { searchParams } = fullUrl;

  const target = searchParams.get("target");
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  // 跨域 OPTIONS 预检
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (!target) {
    return Response.json({ error: "缺少 target 参数" }, { status: 400 });
  }
  if (!GITHUB_TOKEN) {
    return Response.json({ error: "GITHUB_TOKEN 未配置" }, { status: 500 });
  }

  const apiUrl = `https://api.github.com${target}`;
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    "User-Agent": "Vercel-GitHub-Proxy"
  };

  const fetchOptions = {
    headers,
    signal: AbortSignal.timeout(8000)
  };

  if (method !== "GET") {
    fetchOptions.method = method;
    const bodyText = await req.text();
    if (bodyText) {
      fetchOptions.body = bodyText;
      headers["Content-Type"] = "application/json";
    }
  }

  try {
    const githubRes = await fetch(apiUrl, fetchOptions);
    const data = await githubRes.json();
    return Response.json(data, {
      status: githubRes.status,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return Response.json({
      error: "代理调用失败",
      msg: err.message,
      targetUrl: apiUrl
    }, { status: 500 });
  }
}