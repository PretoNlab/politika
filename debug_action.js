import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'situationalReport',
        data: {
          metrics: { totalMentions: 120, avgSentiment: -0.15, hottestTerm: "saúde", overallTrend: "down", termMetrics: {} },
          alerts: { total: 3, dangerCount: 1, opportunityCount: 0, recentAlerts: ["DANGER: saúde - Queda crítica"] },
          topArticles: ["Crise na saúde pública: faltam médicos em 3 UPAs"]
        },
        workspaceContext: { state: "Bahia", region: "Nordeste" }
      })
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
  } catch (err) {
    console.error(err);
  }
}
test();
