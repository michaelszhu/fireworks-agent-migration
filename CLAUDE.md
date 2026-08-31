ASSIGNMENT (verbatim from Fireworks):
Prompt
You're a PM or strategic projects lead at Fireworks. A real complaint we hear is that it’s annoying or difficult for companies to switch from closed models (like GPT or Claude) to open-source models on Fireworks, like Kimi or Minimax. Pick a reason why you think this migration could be difficult. Vibe code a prototype of a tool that could help users address this problem.

Requirements:

Usable, shareable tool prototype
A doc that’s no more than 1 page long that provide an overview of the tool and key choices
Send this tool prototype and doc within 2 hours of receiving the email
Evaluation
Beautiful, polished tools are fun, and we'll expect you to vibe code during the job. However, it's not just about having the most polished, full featured tool. This assignment is only 2 hours because we want to see how you think, rather than seeing how "deep" you can build. We'll have a live discussion to see how you can justify your choices and how you'd think about building upon this if it was a real project.

Two hour limit. Deliverable is a shareable prototype plus a one-page doc.
They said explicitly: not about polish or feature depth, about how I
think. There's a live discussion where I justify choices.

THE ANGLE I PICKED:
Migration is hard because agentic workflows fail behaviourally, not on
output quality. Single-call comparisons don't surface it.

NON-GOALS — do not build:
- scoring, judging, or eval harness (Eval Protocol exists)
- auth, database, saved runs
- streaming
- more than 2 candidate models
- anything not needed for the core comparison

CONSTRAINTS:
- Next.js, TypeScript, Tailwind, App Router
- API keys server-side only, Vercel-deployable
- minimal dependencies
- I need to explain every file in a live discussion