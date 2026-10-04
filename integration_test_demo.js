const http = require('http');

// ==========================================
// 1. STUB: Simulates the Python AI Service
// ==========================================
const aiServiceStub = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        if (req.url === '/api/matchmaking' && req.method === 'POST') {
            const data = JSON.parse(body);
            // Defect injected here (Simulating Interface Defect): 
            // The Backend expects the response field to be "score", but the stub sends "match_score"
            // We will fix this in the "correction" phase.
            const response = {
                freelancer_id: data.freelancer_id,
                project_id: data.project_id,
                match_score: 85.5, // DEFECT: Should be 'score' according to Backend schema
                recommendation: "Highly recommended based on skills."
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
        } else {
            res.writeHead(404);
            res.end();
        }
    });
});

aiServiceStub.listen(8001, () => {
    console.log("[STUB] AI Service Stub running on port 8001");
});

// ==========================================
// 2. DRIVER: Simulates the Backend Module
// ==========================================
async function runDriverIntegrationTest(fixDefect = false) {
    console.log("\n[DRIVER] Initiating Integration Test (Backend -> AI Service)");
    
    // The Backend sends a matchmaking request to the AI Service
    const requestData = JSON.stringify({
        freelancer_id: "F123",
        project_id: "P456",
        skills: ["React", "Node.js"]
    });

    const options = {
        hostname: 'localhost',
        port: 8001,
        path: '/api/matchmaking',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
            console.log(`[DRIVER] Received response from AI Service: ${responseBody}`);
            const responseJson = JSON.parse(responseBody);
            
            // Backend tries to process the 'score'
            const score = fixDefect ? responseJson.score : responseJson.score;
            
            if (score === undefined) {
                console.error("[DRIVER] INTEGRATION TEST FAILED: 'score' is undefined. Interface mismatch detected!");
            } else {
                console.log(`[DRIVER] INTEGRATION TEST PASSED: Successfully retrieved match score: ${score}`);
            }
            
            if (!fixDefect) {
                // Now run with fix
                runFixedTest();
            } else {
                aiServiceStub.close();
            }
        });
    });

    req.on('error', error => console.error(`[DRIVER] Error: ${error.message}`));
    req.write(requestData);
    req.end();
}

// ==========================================
// 3. RETESTING WITH CORRECTION
// ==========================================
function runFixedTest() {
    console.log("\n[SYSTEM] Applying correction to AI Service Stub...");
    
    // Update the stub behavior to fix the defect
    aiServiceStub.removeAllListeners('request');
    aiServiceStub.on('request', (req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            if (req.url === '/api/matchmaking' && req.method === 'POST') {
                const data = JSON.parse(body);
                // FIXED: Using 'score' instead of 'match_score'
                const response = {
                    freelancer_id: data.freelancer_id,
                    project_id: data.project_id,
                    score: 85.5, 
                    recommendation: "Highly recommended based on skills."
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            }
        });
    });

    console.log("[SYSTEM] Retesting integration...");
    // Pass fixDefect = true to the driver so it reads 'score' correctly
    runDriverIntegrationTest(true);
}

// Start the initial test sequence after a short delay
setTimeout(() => runDriverIntegrationTest(false), 500);
