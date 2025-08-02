
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== EDGE FUNCTION: generate-petition ===');
    
    const requestBody = await req.json();
    console.log('Request body keys:', Object.keys(requestBody));
    
    const { templateContent, clientData, lawyerData, tema, subtema, titulo, userDescription } = requestBody;

    // Validações mais rigorosas
    if (!templateContent) {
      console.error('templateContent está vazio ou undefined');
      throw new Error('Conteúdo do template é obrigatório');
    }

    if (!clientData) {
      console.error('clientData está vazio ou undefined');
      throw new Error('Dados do cliente são obrigatórios');
    }

    if (!clientData.name || !clientData.email) {
      console.error('Dados do cliente incompletos:', clientData);
      throw new Error('Nome e email do cliente são obrigatórios');
    }

    if (!tema || !subtema) {
      console.error('Tema ou subtema não fornecidos:', { tema, subtema });
      throw new Error('Tema e subtema são obrigatórios');
    }

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      console.error('DEEPSEEK_API_KEY não configurada');
      throw new Error('Chave da API DeepSeek não configurada. Configure a variável DEEPSEEK_API_KEY.');
    }

    console.log('Gerando petição com DeepSeek...');
    console.log('Template length:', templateContent.length);
    console.log('Cliente:', clientData.name);
    console.log('Advogado:', lawyerData?.name || 'Não informado');
    console.log('Tema/Subtema:', tema, '/', subtema);
    console.log('Descrição do usuário:', userDescription || 'Não fornecida');

    // Preparar dados do cliente de forma mais robusta
    const clientAddress = clientData.address ? 
      `${clientData.address.street || 'Rua não informada'}, ${clientData.address.number || 'S/N'}, ${clientData.address.neighborhood || 'Bairro não informado'}, ${clientData.address.city || 'Cidade não informada'}/${clientData.address.state || 'Estado não informado'}` : 
      'Endereço não informado';

    // Preparar dados do advogado
    const lawyerInfo = lawyerData ? {
      name: lawyerData.name || 'Advogado não informado',
      email: lawyerData.email || 'Email não informado',
      phone: lawyerData.phone || 'Telefone não informado',
      oabNumber: lawyerData.oabNumber || 'OAB não informada',
      city: lawyerData.city || 'Cidade não informada',
      state: lawyerData.state || 'Estado não informado'
    } : {
      name: 'Advogado não informado',
      email: 'Email não informado',
      phone: 'Telefone não informado',
      oabNumber: 'OAB não informada',
      city: 'Cidade não informada',
      state: 'Estado não informado'
    };

    const systemPrompt = `Você é um assistente jurídico especializado em elaboração de petições. Sua tarefa é criar uma petição completa e profissional.

INSTRUÇÕES CRÍTICAS:
1. Gere uma petição COMPLETA e PROFISSIONAL em formato de documento jurídico
2. NUNCA use formatação markdown (como ##, ###, **, etc.) - use apenas texto simples e formatação jurídica
3. A petição DEVE ter TODAS as seções obrigatórias:
   - Cabeçalho dirigido ao juiz
   - QUALIFICAÇÃO DAS PARTES (com dados reais do cliente)
   - DOS FATOS (narrativa detalhada do caso)
   - DO DIREITO (fundamentação jurídica robusta)
   - DOS PEDIDOS (pedidos específicos e detalhados)
   - VALOR DA CAUSA
   - Fecho e assinatura

4. Use ${lawyerInfo.city}, ${lawyerInfo.state} como comarca de referência
5. Baseie a narrativa dos fatos na descrição fornecida pelo usuário
6. Inclua fundamentação jurídica específica para ${tema} - ${subtema}
7. Crie pedidos detalhados e apropriados para o caso
8. Use linguagem jurídica formal e precisa

DADOS DO CLIENTE:
- Nome: ${clientData.name}
- Email: ${clientData.email}
- Telefone: ${clientData.phone || 'Não informado'}
- CPF: ${clientData.cpf || 'Não informado'}
- RG: ${clientData.rg?.number || 'Não informado'} - ${clientData.rg?.issuingBody || 'Não informado'}
- Endereço: ${clientAddress}
- Estado Civil: ${clientData.maritalStatus || 'Não informado'}
- Profissão: ${clientData.profession || 'Não informado'}
- Nacionalidade: ${clientData.nationality || 'Brasileiro(a)'}

DADOS DO ADVOGADO:
- Nome: ${lawyerInfo.name}
- OAB: ${lawyerInfo.oabNumber}
- Cidade/Estado: ${lawyerInfo.city}/${lawyerInfo.state}

CONTEXTO DO CASO:
- Área: ${tema} - ${subtema}
- Título: ${titulo}
${userDescription ? `- Descrição específica do caso: ${userDescription}` : ''}

FORMATO ESPERADO (sem markdown):

EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ___ª VARA CÍVEL DA COMARCA DE ${lawyerInfo.city.toUpperCase()}

[Título da Ação]

QUALIFICAÇÃO DAS PARTES

REQUERENTE: [dados completos do cliente com formatação jurídica]

REQUERIDO: [a ser definido conforme o caso]

DOS FATOS

[Narrativa detalhada baseada na descrição fornecida, com numeração dos parágrafos]

DO DIREITO

[Fundamentação jurídica robusta específica para ${tema}]

DOS PEDIDOS

Diante do exposto, requer-se a Vossa Excelência:
[Pedidos específicos e detalhados]

VALOR DA CAUSA
[Valor apropriado]

Nestes termos,
Pede deferimento.

${lawyerInfo.city}, [data atual].

[Linha para assinatura]
${lawyerInfo.name}
${lawyerInfo.oabNumber}

IMPORTANTE: NÃO use markdown. Retorne apenas o texto da petição formatado como documento jurídico.`;

    const userPrompt = userDescription 
      ? `Gere uma petição completa para um caso de ${tema} - ${subtema}. Baseie a seção DOS FATOS na seguinte descrição do caso: "${userDescription}". Inclua fundamentação jurídica robusta e pedidos específicos. Use ${lawyerInfo.city} como comarca.`
      : `Gere uma petição completa para um caso de ${tema} - ${subtema}. Crie uma narrativa factual apropriada para este tipo de caso, fundamentação jurídica robusta e pedidos específicos. Use ${lawyerInfo.city} como comarca.`;

    console.log('Enviando request para DeepSeek...');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 8000,
        top_p: 0.95,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`Erro na API DeepSeek (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('DeepSeek response keys:', Object.keys(data));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Estrutura de resposta inválida:', data);
      throw new Error('Resposta inválida da API DeepSeek');
    }

    let generatedPetition = data.choices[0].message.content;
    
    // Limpar qualquer markdown residual
    generatedPetition = generatedPetition
      .replace(/```markdown\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();

    if (!generatedPetition || generatedPetition.length < 200) {
      console.error('Petição gerada muito curta ou vazia:', generatedPetition);
      throw new Error('Petição gerada está vazia ou muito curta');
    }

    // Substituir placeholders de data
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    generatedPetition = generatedPetition.replace(/\[data atual\]/g, currentDate);

    console.log('Petição gerada com sucesso!');
    console.log('Tamanho da petição:', generatedPetition.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        generatedPetition: generatedPetition
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('=== ERRO NA EDGE FUNCTION ===');
    console.error('Erro completo:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
