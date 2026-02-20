// Script to simulate a sentiment drop in localStorage to trigger an alert
const STORAGE_KEYS = {
    sentimentHistory: 'politika_sentiment_history'
};

const mockHistory = {
    "joaobiden": {
        term: "joaobiden",
        score: 0.8, // High previous score
        timestamp: new Date().toISOString()
    }
};

console.log("To simulate a sentiment drop, run the following in your browser console:");
console.log(`localStorage.setItem('${STORAGE_KEYS.sentimentHistory}', JSON.stringify(${JSON.stringify(mockHistory)}));`);
console.log("Then refresh the CommandCenter page where the mock data sets the current score lower (or use the mock data injector).");
