import { createServer } from "node:http";
import { initializeSocket } from "./libs/socket.js";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt("3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Handle socket.io requests
        if (req.url?.startsWith('/socket.io/')) {
            return;
        }
        // Handle Next.js requests
        handle(req, res);
    });
    
    // Initialize socket.io with the HTTP server
    initializeSocket(httpServer);

    httpServer.listen(port, () => {
        console.log(`Server running on http://${hostname}:${port}`);
    });
});
  



  
