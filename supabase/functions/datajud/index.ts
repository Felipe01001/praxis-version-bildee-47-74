
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Headers CORS para permitir acesso do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// A chave da API do DataJud
const API_KEY = "APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }
  
  try {
    // Parse o corpo da solicitação
    const { numeroProcesso, tribunal } = await req.json();
    
    if (!numeroProcesso || !tribunal) {
      return new Response(
        JSON.stringify({ error: "Número do processo e tribunal são obrigatórios" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Buscando processo: ${numeroProcesso} no tribunal: ${tribunal}`);
    const apiUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal.toLowerCase()}/_search`;
    console.log(`URL da requisição: ${apiUrl}`);
    
    // Cria o payload da consulta
    const payload = {
      query: {
        match: {
          numeroProcesso: numeroProcesso
        }
      }
    };
    
    console.log(`Payload da consulta:`, JSON.stringify(payload));
    
    // Faz a chamada para a API do DataJud
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    // Obtém os dados da resposta mesmo se o status não for 2xx
    const responseData = await response.json();
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Erro desconhecido");
      console.error(`Erro na API do DataJud: ${response.status} - ${errorText}`);
      
      // Retornar erro específico para cada código de status
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: `Tribunal "${tribunal}" não encontrado na API. Verifique se o código do tribunal está correto.`,
            status: 404,
            details: errorText
          }),
          { 
            status: 200, // Retorna 200 para que o frontend possa processar
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Erro ao acessar a API do DataJud: ${response.status}`,
          status: response.status,
          details: errorText
        }),
        { 
          status: 200, // Retorna 200 para que o frontend possa processar
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Verifica se o processo foi encontrado com uma resposta mais informativa
    if (!responseData.hits?.hits || responseData.hits?.hits.length === 0) {
      console.log(`Processo ${numeroProcesso} não encontrado no tribunal ${tribunal}`);
      return new Response(
        JSON.stringify({ 
          error: `Processo não encontrado no tribunal ${tribunal}`,
          message: `O processo ${numeroProcesso} não foi localizado na base de dados do tribunal ${tribunal}. Verifique se o número está correto e se o processo pertence realmente a este tribunal.`,
          status: 404,
          found: false,
          data: responseData // Incluir resposta original para depuração
        }),
        { 
          status: 200, // Retorna 200 para que o frontend possa processar
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Retorna os dados para o cliente
    return new Response(
      JSON.stringify({
        found: true,
        status: 200,
        data: responseData
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Erro na função datajud:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: "Ocorreu um erro interno ao consultar o processo. Tente novamente mais tarde.",
        status: 500
      }),
      { 
        status: 200, // Retorna 200 para que o frontend possa processar
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
