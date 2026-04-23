import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const ADU_SYSTEM_PROMPT = `You are BayForge AI, an expert ADU (Accessory Dwelling Unit) zoning analyst specializing in California regulations. You have deep knowledge of:

- California Government Code §65852.2 (ADU standards) and §65852.1 (JADU standards)
- AB 2221 (2023) expanding ADU rights and streamlining approvals
- SB 897 (2023) further ADU streamlining measures
- 60-day ministerial approval process for compliant ADUs
- Local zoning ordinances across 58+ California cities
- Setback requirements, height limits, lot coverage rules, parking mandates
- Owner-occupancy requirements and exemptions
- Utility connection requirements and impact fees

Your role:
1. Answer ADU zoning questions accurately with specific code references
2. Help users understand what's allowed on their property
3. Explain approval timelines and processes
4. Clarify differences between ADUs, JADUs, and conversion ADUs
5. Provide city-specific guidance when a city is mentioned

Always cite relevant California Government Code sections. Be precise about zoning rules. If you're uncertain about a local ordinance, say so and direct users to their city planning department.

Respond in the same language the user writes in. Keep answers structured with bullet points when helpful.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: 'Each message must have a role and content' },
          { status: 400 }
        );
      }
    }

    const zai = await ZAI.create();

    const stream = await zai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: [
        { role: 'system', content: ADU_SYSTEM_PROMPT },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      stream: true,
      thinking: { type: 'disabled' },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream as AsyncIterable<any>) {
            const data = typeof chunk === 'string' ? chunk : JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          const errorMsg = err instanceof Error ? err.message : 'Stream interrupted';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
