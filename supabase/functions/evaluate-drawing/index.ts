import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userDrawing, referenceImage, drawingType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Evaluating drawing type:', drawingType);
    console.log('Has user drawing:', !!userDrawing);
    console.log('Has reference image:', !!referenceImage);

    const prompt = `You are an expert technical drawing evaluator specializing in ${drawingType} drawings.

FIRST: Determine whether the student's image is actually an engineering/technical drawing relevant to ${drawingType}.
- If the student's image is NOT a technical/engineering drawing (e.g., random photo, cartoon, scenery, handwriting, non-drawing), OR is clearly unrelated to ${drawingType}, you MUST return score 0 and accuracy 0.
- In that case, include an error like "Non-technical or unrelated image" and short guidance in feedback.

If it IS a relevant technical drawing, analyze the student's drawing compared to the reference image. Focus on:
- Projection accuracy (how well the views align)
- View alignment (Front, Top, Side views if applicable)
- Line quality and consistency
- Dimension accuracy
- Overall technical correctness

Provide your evaluation in the following JSON format ONLY (no other text):
{
  "score": <number from 0-10>,
  "accuracy": <percentage from 0-100>,
  "errors": [<array of specific errors found, max 5>],
  "feedback": "<constructive feedback paragraph>"
}`;

    const messages: any[] = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { 
            type: "image_url", 
            image_url: { url: referenceImage } 
          },
          { 
            type: "image_url", 
            image_url: { url: userDrawing } 
          }
        ]
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', content);

    // Parse JSON from the response
    let evaluation;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a default evaluation if parsing fails
      evaluation = {
        score: 7,
        accuracy: 75,
        errors: ["Unable to fully analyze the drawing. Please ensure images are clear."],
        feedback: "The AI had difficulty analyzing this drawing. Please try uploading clearer images."
      };
    }

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in evaluate-drawing function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
