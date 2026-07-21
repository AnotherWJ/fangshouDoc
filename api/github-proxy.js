export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!target) {
    return Response.json({ error: "缺少 target 参数" }, { status: 400 });
  }
  if (!GITHUB_TOKEN) {
    return Response.json({ error: "服务端未配置Token" }, { status: 500 });
  }

  const apiUrl = `https://api.github.com${target}`;

  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    "User-Agent": "Vercel-Github-Proxy"
  };

  let fetchOpt = { headers };
  // 如果是POST/PUT请求（保存文件）带上body
  if (req.method !== "GET") {
    fetchOpt.method = req.method;
    fetchOpt.body = await req.text();
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiUrl, fetchOpt);
  const result = await res.json();

  return Response.json(result, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}