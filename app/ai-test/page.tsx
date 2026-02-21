// This is a Server Component. It runs securely on the server!
export default async function AITestPage() {
    // 1. Knock on the Python Drive-Thru window.
    // We can fetch data in Server Components using the fetch API.
    // The { cache: 'no-store' } rule forces it to get fresh data every single time.
    const response = await fetch('http://127.0.0.1:8000', { cache: 'no-store' });
    
    // 2. Translate the raw JSON into readable text.
    const data = await response.json();
  
    // 3. Display it on the screen.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-10">
        <h1 className="text-4xl font-bold text-yellow-500 mb-6">Lotus AI Connection Test</h1>
        
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 shadow-xl">
          <p className="text-lg text-gray-300 mb-2">
            <span className="font-bold text-white">Engine Status:</span> {data.status}
          </p>
          <p className="text-lg text-gray-300">
            <span className="font-bold text-white">System Message:</span> {data.message}
          </p>
        </div>
      </div>
    );
  }