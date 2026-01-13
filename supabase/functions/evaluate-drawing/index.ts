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

    const prompt = `You are an EXTREMELY STRICT expert technical drawing evaluator specializing in ${drawingType} engineering drawings.

## CRITICAL FIRST STEP - IMAGE VALIDATION (MANDATORY)
Before ANY evaluation, you MUST determine if the student's uploaded image is actually a valid technical/engineering drawing.

### IMMEDIATELY REJECT with score 0 and accuracy 0 if the image is:
- A photograph of a real object, person, animal, or scene
- A cartoon, sketch, doodle, or artistic drawing (not engineering)
- Handwritten notes or text without technical drawings
- A screenshot of software, website, or app
- Random shapes, scribbles, or abstract art
- A meme, logo, or graphic design
- Any image that is NOT a proper technical/engineering drawing on paper or CAD
- A drawing that is completely unrelated to ${drawingType} projection
- A blank or nearly blank image
- A photo of something other than a technical drawing sheet

If rejected, respond with:
{
  "score": 0,
  "accuracy": 0,
  "errors": ["This is not a valid ${drawingType} engineering drawing. The uploaded image appears to be [describe what it is]. Please upload an actual technical drawing."],
  "feedback": "Your submission was rejected because it is not a technical engineering drawing. Please upload a proper ${drawingType} projection drawing on paper or from CAD software."
}

## IF IT IS A VALID TECHNICAL DRAWING:
Analyze the student's ${drawingType} drawing compared to the reference image. Be STRICT and DETAILED in your evaluation.

### Evaluation Criteria for ${drawingType} Drawings:
1. **Projection Accuracy (0-3 points)**: How accurately are the views projected? Are dimensions transferred correctly between views?
2. **View Alignment (0-2 points)**: Are Front, Top, Side views properly aligned? Are projection lines correct?
3. **Line Quality (0-2 points)**: Are object lines dark and consistent? Are hidden lines dashed correctly? Are center lines properly drawn?
4. **Dimension Accuracy (0-2 points)**: Are all dimensions present and correctly placed? Are dimension lines and arrows proper?
5. **Overall Technical Correctness (0-1 point)**: General neatness, proper spacing, title block if applicable

### Scoring Guidelines:
- 9-10: Professional quality, minimal or no errors
- 7-8: Good quality with minor issues
- 5-6: Acceptable but needs improvement
- 3-4: Poor quality with significant errors
- 1-2: Very poor, major fundamental errors
- 0: Not a valid technical drawing OR completely wrong type of drawing

Provide your evaluation in the following JSON format ONLY (no other text):
{
  "score": <number from 0-10>,
  "accuracy": <percentage from 0-100>,
  "errors": [<array of specific errors found, be detailed, max 5>],
  "feedback": "<constructive feedback paragraph explaining strengths and areas for improvement>"
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
        score: 0,
        accuracy: 0,
        errors: ["Unable to analyze the drawing. The image may not be a valid technical drawing."],
        feedback: "The AI could not properly evaluate this submission. Please ensure you upload a clear photo or scan of an actual engineering drawing."
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
