import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

const systemPrompt = `You are a financial document analyzer specialized in parsing Brazilian bank statements.
Your task is to extract ALL transactions EXACTLY as they appear in the document. Do NOT invent, estimate, or modify any data.

CRITICAL RULES FOR DATA INTEGRITY:
1. Extract ONLY transactions that are explicitly present in the text/image
2. Use the EXACT amounts shown - do not round, estimate, or modify values
3. Use the EXACT dates shown - convert to YYYY-MM-DD format but do not guess dates
4. Use the EXACT descriptions - preserve merchant names, PIX keys, transfer details
5. If any data is unclear or partially visible, mark description with [VERIFICAR]
6. Do NOT create transactions that aren't in the document
7. If you cannot determine income vs expense from context, default to "expense"

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
- DEBITO = expense`;

const toolDefinition = {
  type: "function",
  function: {
    name: "extract_transactions",
    description: "Extract transactions exactly as they appear in the bank statement",
    parameters: {
      type: "object",
      properties: {
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
          description: "Notes about extraction quality or issues found"
        }
      },
      required: ["transactions"],
      additionalProperties: false
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      // OCR mode - send images to vision model
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
      // Text mode - direct text extraction
      console.log(`Processing text content: ${textContent.length} characters`);
      
      const truncatedContent = textContent.slice(0, 50000);
      rawText = truncatedContent.slice(0, 500) + "...";
      
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract ALL transactions from this bank statement. Return ONLY transactions that are explicitly shown in the text. Do not invent data.\n\nBank Statement Text:\n${truncatedContent}` }
      ];
      
    } else if (pdfBase64 || pdfContent) {
      // Legacy mode - handle old requests
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "extract_transactions" } }
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
    if (!toolCall || toolCall.function.name !== "extract_transactions") {
      console.error("Unexpected response format:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: "Formato de resposta inesperado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    
    // Validate transactions
    const validTransactions: ExtractedTransaction[] = extractedData.transactions
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

    console.log(`Extracted ${validTransactions.length} valid transactions (mode: ${mode || 'legacy'})`);

    return new Response(
      JSON.stringify({ 
        transactions: validTransactions,
        rawText,
        mode: mode || 'legacy',
        summary: {
          total_income: validTransactions.filter((t: ExtractedTransaction) => t.type === "income").reduce((sum: number, t: ExtractedTransaction) => sum + t.amount, 0),
          total_expenses: validTransactions.filter((t: ExtractedTransaction) => t.type === "expense").reduce((sum: number, t: ExtractedTransaction) => sum + t.amount, 0),
          transaction_count: validTransactions.length
        },
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
