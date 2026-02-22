// This is a Server Component. It runs securely on the server!
export default async function AITestPage() {
  // 1. Knock on the new Python Drive-Thru window endpoint.
  // The { cache: 'no-store' } rule forces it to get fresh data every single time.
  const response = await fetch('http://127.0.0.1:8000/api/recommend/1', { cache: 'no-store' });
  
  // 2. Translate the raw JSON into readable text.
  const data = await response.json();

  // 3. Display it on the screen.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold text-yellow-500 mb-6">Lotus AI Connection Test</h1>
      
      {/* We keep your exact dark-mode card design, just making it wide enough to hold the list */}
      <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 shadow-xl w-full max-w-2xl">
        <p className="text-lg text-gray-300 mb-6 border-b border-gray-700 pb-4">
          <span className="font-bold text-white">Target Item ID:</span> {data.target_item_id} (Premium White Stone Jhumka)
        </p>
        
        <p className="text-xl font-bold text-white mb-4">AI Recommendations:</p>
        
        <div className="flex flex-col gap-4">
          {/* We map over the array of recommendations and build a mini-row for each one */}
          {data.recommendations.map((rec: any) => (
            <div key={rec.id} className="bg-black p-4 rounded border border-gray-700">
              <p className="text-lg text-gray-300">
                <span className="font-bold text-white">Item:</span> {rec.name}
              </p>
              <p className="text-lg text-gray-300">
                <span className="font-bold text-yellow-500">Match Score:</span> {rec.match_score}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}