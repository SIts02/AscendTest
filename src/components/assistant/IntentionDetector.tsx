import { type Assistant } from "@/types/assistant";

interface IntentionMatch {
  intention: string;
  response: string;
  suggestions: string[];
}

const intentionPatterns: Record<string, IntentionMatch[]> = {
  "financial-advisor": [
    {
      intention: "ficar rico|enriquecer|ganhar dinheiro|fazer dinheiro",
      response: "Entendo que você quer construir riqueza! Isso é um excelente objetivo. Para começar, vou sugerir algumas estratégias comprovadas: primeiro, estabeleça uma reserva de emergência, depois comece a investir regularmente em uma carteira diversificada. O segredo está na consistência e no tempo - pequenos investimentos mensais podem se transformar em grandes fortunas com o poder dos juros compostos.",
      suggestions: [
        "Como começar a investir com pouco dinheiro?",
        "Qual o primeiro passo para construir riqueza?",
        "Me mostre estratégias de investimento para longo prazo"
      ]
    },
    {
      intention: "comprar casa|comprar imóvel|financiar casa|casa própria",
      response: "Ótimo objetivo! Comprar uma casa é um dos maiores investimentos da vida. Vamos criar um plano personalizado para você: primeiro, calcule quanto você pode dar de entrada (idealmente 20% do valor), depois organize suas finanças para conseguir uma boa taxa de financiamento. Também é importante considerar todos os custos extras como documentação, ITBI e reformas.",
      suggestions: [
        "Quanto preciso juntar para dar entrada numa casa?",
        "Como melhorar meu score para conseguir bom financiamento?",
        "Quais são todos os custos para comprar uma casa?"
      ]
    },
    {
      intention: "comprar carro|trocar carro|financiar carro",
      response: "Vejo que você quer adquirir um veículo! Vamos pensar estrategicamente: considere se é melhor comprar à vista, financiar ou fazer um consórcio. Analise também se um carro usado em bom estado não atenderia suas necessidades com melhor custo-benefício. Lembre-se de incluir no orçamento seguro, IPVA, manutenção e combustível.",
      suggestions: [
        "É melhor financiar ou comprar à vista?",
        "Como calcular o custo total de ter um carro?",
        "Consórcio vale a pena?"
      ]
    },
    {
      intention: "viajar|fazer viagem|conhecer lugares",
      response: "Que sonho maravilhoso! Viajar é um investimento em experiências. Vamos criar um plano financeiro para sua viagem: defina o destino e calcule todos os custos (passagem, hospedagem, alimentação, passeios), depois estabeleça uma meta mensal de economia. Uma dica: pesquise épocas mais baratas e considere programas de milhas.",
      suggestions: [
        "Como economizar para uma viagem internacional?",
        "Qual a melhor forma de usar milhas aéreas?",
        "Como planejar financeiramente uma viagem?"
      ]
    },
    {
      intention: "aposentar|aposentadoria|parar de trabalhar|independência financeira",
      response: "Excelente pensamento de longo prazo! A aposentadoria confortável requer planejamento. Vamos calcular quanto você precisa: a regra geral é ter 25 vezes seus gastos anuais investidos. Comece contribuindo para a previdência privada e investindo em uma carteira diversificada. Quanto antes começar, menor será o valor mensal necessário.",
      suggestions: [
        "Quanto preciso para me aposentar?",
        "Previdência privada vale a pena?",
        "Como calcular minha aposentadoria ideal?"
      ]
    }
  ],
  "budget-assistant": [
    {
      intention: "economizar|poupar|gastar menos|cortar gastos",
      response: "Ótima intenção! Vou te ajudar a identificar onde você pode economizar sem perder qualidade de vida. Primeiro, vamos analisar seus gastos dos últimos 3 meses para encontrar padrões. Depois, aplicaremos a regra 50-30-20: 50% para necessidades, 30% para desejos e 20% para poupança. Pequenas mudanças podem gerar grandes economias!",
      suggestions: [
        "Onde posso cortar gastos sem afetar minha qualidade de vida?",
        "Como aplicar a regra 50-30-20 no meu orçamento?",
        "Me ajude a identificar gastos desnecessários"
      ]
    },
    {
      intention: "controlar gastos|organizar dinheiro|fazer orçamento",
      response: "Perfeito! Organizar as finanças é o primeiro passo para o sucesso financeiro. Vamos criar um sistema simples: categorize todos seus gastos, defina limites para cada categoria e acompanhe semanalmente. Use a regra: toda compra acima de R$ 100 deve ser pensada por 24 horas antes de decidir.",
      suggestions: [
        "Como criar um orçamento que funciona?",
        "Qual app ou método usar para controlar gastos?",
        "Como definir limites para cada categoria de gasto?"
      ]
    }
  ]
};

export const detectIntention = (message: string, assistantId: string): IntentionMatch | null => {
  const lowerMessage = message.toLowerCase();
  const patterns = intentionPatterns[assistantId] || [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.intention, 'i');
    if (regex.test(lowerMessage)) {
      return pattern;
    }
  }

  return null;
};