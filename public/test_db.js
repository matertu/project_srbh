

const CONFIG = {
  API_URL: "https://ytrowyxkuemlqmiyfvll.supabase.co/rest/v1",
  API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0cm93eXhrdWVtbHFtaXlmdmxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU5MjA4NCwiZXhwIjoyMDk0MTY4MDg0fQ.VneeIzziKTakMFBKI3_YPg9iDwjcjWuayJw8DHllOcI"
};

async function test() {
  const url = `${CONFIG.API_URL}/estacao?select=*,roteiro(nome_roteiro)&cod_ana_estacao=eq.62663800&limit=1`;
  const opts = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      apikey: CONFIG.API_KEY,
      Authorization: `Bearer ${CONFIG.API_KEY}`,
    }
  };
  const res = await fetch(url, opts);
  const data = await res.json();
  console.log("Result for eq.62663800:", data);
  
  // also check if we can list it without eq
  const url2 = `${CONFIG.API_URL}/estacao?select=cod_ana_estacao,nome_estacao&limit=30`;
  const res2 = await fetch(url2, opts);
  const data2 = await res2.json();
  console.log("All stations sample:", data2.find(d => String(d.cod_ana_estacao).includes("62663800")));
}
test();
