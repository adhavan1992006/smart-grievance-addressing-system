const http = require('http');

const testCases = [
  { text: "Large pothole on main road causing accidents and severe vehicle damage", expected: "Road & Footpath Issues" },
  { text: "Street light not working in residential area for past three weeks", expected: "Street Light Problems" },
  { text: "Garbage dumped openly on street corner creating unbearable stench", expected: "Garbage & Waste Collection" },
  { text: "Sewage overflowing from drainage manhole onto the public footpath", expected: "Drainage & Sewerage" },
  { text: "Contaminated drinking water coming from municipal tap with bad odor", expected: "Water Supply Problems" },
  { text: "Dengue mosquito breeding in stagnant water near public park", expected: "Public Health & Epidemic" },
  { text: "Fallen tree branches blocking traffic on highway after heavy rain", expected: "Parks & Greenery" },
  { text: "Open manhole on pedestrian pathway posing danger to school children", expected: "Road & Footpath Issues" },
  { text: "Illegal garbage burning at empty plot polluting neighborhood air", expected: "Garbage & Waste Collection" },
  { text: "Broken water supply pipeline causing massive clean water leakage", expected: "Water Supply Problems" },
  { text: "Non-functioning traffic signal at busy intersection leading to jams", expected: "Traffic & Road Safety" },
  { text: "Stray dog menace near primary school threatening public safety", expected: "Stray Animals & Pest Control" },
  { text: "Dead animal carcass lying uncollected on side of road for days", expected: "Sanitation & Cleanliness" },
  { text: "Public toilet in bus stand is extremely dirty without running water", expected: "Sanitation & Cleanliness" },
  { text: "Flickering high mast light in public park causing electrical hazard", expected: "Street Light Problems" }
];

function predict(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ description: text });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/predict',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Running AI Model Test Suite (15 Test Cases)...\n");
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const res = await predict(tc.text);
      results.push({
        Id: i + 1,
        Input: tc.text.length > 40 ? tc.text.substring(0, 38) + "..." : tc.text,
        Predicted: res.category,
        Confidence: (res.confidence * 100).toFixed(1) + "%",
        Success: res.success,
        ValidCategory: res.category !== "No Category Detected" && res.category !== "Other"
      });
    } catch (err) {
      results.push({
        Id: i + 1,
        Input: tc.text.substring(0, 38) + "...",
        Error: err.message
      });
    }
  }
  console.table(results);
}

run();
