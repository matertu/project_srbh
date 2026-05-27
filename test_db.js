const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const html = fs.readFileSync('public/dashboard_tecnico.html', 'utf8');

// I will just use node fetch with the config.
const configStr = fs.readFileSync('public/js/supabase-config.js', 'utf8');
let SUPABASE_URL = configStr.match(/const SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
let SUPABASE_ANON_KEY = configStr.match(/const SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

fetch(`${SUPABASE_URL}/rest/v1/boletim?select=*,estacao(id_estacao,nome_estacao,cod_ana_estacao,id_roteiro,roteiro(id_roteiro,nome_roteiro)),funcionarios(id_func,nome_func)&limit=1`, {
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  }
}).then(r => r.text()).then(t => console.log(t)).catch(console.error);
