import { serve } from "https:
import { createClient } from 'https:

function getCorsHeaders(request: Request) {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',').map(o => o.trim()) || [];
  const requestOrigin = request.headers.get('Origin');

  let corsOrigin: string;

  if (allowedOrigins.length === 0) {

    corsOrigin = '*';
    console.warn('⚠️ ALLOWED_ORIGINS not configured, using permissive CORS (development mode)');
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {

    corsOrigin = requestOrigin;
  } else {

    corsOrigin = allowedOrigins[0] || '*';
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

const systemPrompt = `You are a financial document analyzer specialized in parsing Brazilian bank statements.
Your task is to extract ALL information from the document EXACTLY as it appears. Do NOT invent, estimate, or modify any data.

CRITICAL RULES FOR DATA INTEGRITY:
1. Extract ONLY data that is explicitly present in the text/image
2. Use the EXACT amounts shown - do not round, estimate, or modify values
3. Use the EXACT dates shown - convert to YYYY-MM-DD format but do not guess dates
4. Use the EXACT descriptions - preserve merchant names, PIX keys, transfer details
5. If any data is unclear or partially visible, mark description with [VERIFICAR]
6. Do NOT create transactions that aren't in the document
7. If you cannot determine income vs expense from context, default to "expense"

STEP 1: IDENTIFY BANK AND METADATA
- Bank name (e.g., "Nubank", "Itaú", "Santander", "Bradesco", "Banco do Brasil")
- Account number (agência/conta format)
- Statement period: start date and end date (YYYY-MM-DD format)
- Initial balance (saldo inicial)
- Final balance (saldo final)

STEP 2: EXTRACT TRANSACTIONS
For each transaction, extract:
1. Date: The exact date in YYYY-MM-DD format (convert from DD/MM/YYYY if needed)
2. Description: The exact merchant name or transaction description as shown
3. Amount: The exact numeric value (as positive number, without R$ symbol)
4. Type: "income" for deposits/credits/transfers IN, "expense" for withdrawals/payments/transfers OUT

Common Brazilian bank patterns:
- PIX RECEBIDO = income
- PIX ENVIADO = expense
- TRANSF RECEBIDA = income
- TRANSF ENVIADA = expense
- DEPOSITO = income
- SAQUE = expense
- PAGTO/PAGAMENTO = expense
- COMPRA = expense
- ESTORNO = income (refund)
- CREDITO = income
- DEBITO = expense

STEP 3: VALIDATION
Calculate: initial_balance + total_income - total_expenses = final_balance
If this doesn't match, note it in extraction_notes.`;

const toolDefinition = {
  type: "function",
  function: {
    name: "extract_bank_statement",
    description: "Extract complete bank statement information including metadata and transactions",
    parameters: {
      type: "object",
      properties: {
        bank_info: {
          type: "object",
          description: "Bank identification and account information",
          properties: {
            bank_name: { type: "string", description: "Name of the bank (e.g., Nubank, Itaú, Santander)" },
            account: { type: "string", description: "Account number or agência/conta format" }
          },
          required: ["bank_name"]
        },
        period: {
          type: "object",
          description: "Statement period",
          properties: {
            start: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end: { type: "string", description: "End date in YYYY-MM-DD format" }
          },
          required: ["start", "end"]
        },
        summary: {
          type: "object",
          description: "Balance summary for validation",
          properties: {
            initial_balance: { type: "number", description: "Initial balance at start of period" },
            final_balance: { type: "number", description: "Final balance at end of period" }
          },
          required: ["initial_balance", "final_balance"]
        },
        transactions: {
          type: "array",
          description: "List of transactions extracted exactly from the document",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "Transaction date in YYYY-MM-DD format" },
              description: { type: "string", description: "Exact transaction description from document" },
              amount: { type: "number", description: "Exact transaction amount as shown" },
              type: { type: "string", enum: ["income", "expense"], description: "Transaction type" }
            },
            required: ["date", "description", "amount", "type"],
            additionalProperties: false
          }
        },
        extraction_notes: {
          type: "string",
          description: "Notes about extraction quality, validation issues, or problems found"
        }
      },
      required: ["bank_info", "period", "summary", "transactions"],
      additionalProperties: false
    }
  }
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Token de autenticação não fornecido.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('Invalid or expired token', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado. Faça login novamente.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Authenticated request from user: ${user.id}`);
  } catch (authException: any) {
    console.error('Authentication error:', authException);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar autenticação' }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { mode, textContent, images, pdfBase64, pdfContent, fileName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let messages: any[] = [];
    let rawText = "";

    if (mode === "ocr" && images && images.length > 0) {

      console.log(`Processing ${images.length} page images for OCR`);

      const imageContents = images.map((base64: string, index: number) => ({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64}`
        }
      }));

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze these ${images.length} page(s) of a bank statement and extract ALL transactions. Return ONLY transactions that are explicitly visible. Do not invent data.` },
            ...imageContents
          ]
        }
      ];

      rawText = "[OCR Mode - Text extracted from images]";

    } else if (mode === "text" && textContent) {

      console.log(`Processing text content: ${textContent.length} characters`);

      const truncatedContent = textContent.slice(0, 50000);
      rawText = truncatedContent.slice(0, 500) + "...";

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract ALL transactions from this bank statement. Return ONLY transactions that are explicitly shown in the text. Do not invent data.\n\nBank Statement Text:\n${truncatedContent}` }
      ];

    } else if (pdfBase64 || pdfContent) {

      const content = pdfContent || "";
      if (content.length < 50) {
        return new Response(
          JSON.stringify({
            error: "Não foi possível extrair texto suficiente do PDF. O arquivo pode estar protegido ou ser uma imagem escaneada.",
            rawText: content
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const truncatedContent = content.slice(0, 50000);
      rawText = truncatedContent.slice(0, 500) + "...";

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract ALL transactions from this bank statement. Return ONLY transactions that are explicitly shown in the text. Do not invent data.\n\nBank Statement Text:\n${truncatedContent}` }
      ];

    } else {
      return new Response(
        JSON.stringify({ error: "PDF content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending request to AI gateway, mode: ${mode || 'legacy'}`);

    const response = await fetch("https:
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "extract_bank_statement" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar o documento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_bank_statement") {
      console.error("Unexpected response format:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "Formato de resposta inesperado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    const validTransactions: ExtractedTransaction[] = (extractedData.transactions || [])
      .filter((t: any) => {
        const hasDate = t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date);
        const hasDescription = t.description && t.description.trim().length > 0;
        const hasAmount = typeof t.amount === "number" && t.amount > 0;
        return hasDate && hasDescription && hasAmount;
      })
      .map((t: any) => ({
        date: t.date,
        description: t.description.trim(),
        amount: t.amount,
        type: t.type === "income" ? "income" : "expense"
      }));

    const totalIncome = validTransactions
      .filter((t: ExtractedTransaction) => t.type === "income")
      .reduce((sum: number, t: ExtractedTransaction) => sum + t.amount, 0);

    const totalExpenses = validTransactions
      .filter((t: ExtractedTransaction) => t.type === "expense")
      .reduce((sum: number, t: ExtractedTransaction) => sum + t.amount, 0);

    const initialBalance = extractedData.summary?.initial_balance || 0;
    const finalBalance = extractedData.summary?.final_balance || 0;
    const calculatedFinalBalance = initialBalance + totalIncome - totalExpenses;
    const balanceDifference = Math.abs(calculatedFinalBalance - finalBalance);
    const balanceMatches = balanceDifference < 0.01;

    const transactionHashes = validTransactions.map((t: ExtractedTransaction) => {

      const hashString = `${t.date}|${t.amount}|${t.description.substring(0, 50)}`;

      let hash = 0;
      for (let i = 0; i < hashString.length; i++) {
        const char = hashString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    });

    console.log(`Extracted ${validTransactions.length} valid transactions (mode: ${mode || 'legacy'})`);
    console.log(`Balance validation: ${balanceMatches ? 'PASSED' : 'FAILED'} (diff: ${balanceDifference.toFixed(2)})`);

    return new Response(
      JSON.stringify({
        bank_info: extractedData.bank_info || { bank_name: "Desconhecido", account: null },
        period: extractedData.period || { start: null, end: null },
        summary: {
          initial_balance: initialBalance,
          final_balance: finalBalance,
          calculated_final_balance: calculatedFinalBalance,
          total_income: totalIncome,
          total_expenses: totalExpenses,
          transaction_count: validTransactions.length,
          balance_valid: balanceMatches,
          balance_difference: balanceDifference
        },
        transactions: validTransactions,
        transaction_hashes: transactionHashes,
        rawText,
        mode: mode || 'legacy',
        extraction_notes: extractedData.extraction_notes || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing bank statement:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar o extrato" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});