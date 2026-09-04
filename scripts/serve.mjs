import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {build} from './build.mjs';
const output = await build();
const types = {'.js':'text/javascript; charset=utf-8','.woff2':'font/woff2','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file = path.resolve(output, '.' + pathname);
    if (!file.startsWith(output + path.sep) && file !== output) {res.writeHead(403);res.end();return;}
    if ((await stat(file)).isDirectory()) {
      if (!pathname.endsWith('/')) {res.writeHead(301,{Location:pathname+'/'});res.end();return;}
      file = path.join(file,'index.html');
    }
    res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream'});
    res.end(await readFile(file));
  } catch {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(output,'404.html')));}
});
server.listen(Number(process.env.PORT ?? 4173),'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${server.address().port} — run npm run build after edits, then refresh.`));
