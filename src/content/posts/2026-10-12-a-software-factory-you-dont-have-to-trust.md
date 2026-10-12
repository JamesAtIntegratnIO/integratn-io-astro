---
title: "A Software Factory You Don't Have to Trust"
pubDate: 2026-10-12T13:00:00.000Z
tags: [ai, ai-agent, agentic-development, specmarshal, engineering-leadership]
categories: [workflow]
heroImage: /og/blog/2026-10-12-a-software-factory-you-dont-have-to-trust.png
card: /og/blog/2026-10-12-a-software-factory-you-dont-have-to-trust.png
description: "For the CTO who wants agents building overnight but won't let them run unchecked: how Specmarshal keeps people in charge of what gets built, what counts as done, and what ships."
---


So you're a CTO. Or you run engineering, or you're the person who gets asked "what's our AI strategy" in every leadership meeting. You've watched the demos. You've seen an agent knock out a feature in twenty minutes. You've probably also seen one confidently tell you the tests pass when it never ran them.

You want the speed. You want the "software factory" thing where work comes in one end and branches come out the other while your team sleeps.

But you don't trust it to run on its own.

Good. You shouldn't.

I built [Specmarshal](/products/specmarshal) around that distrust. Every decision that matters gets made by your tests, by a separate reviewer, or by a person. Never by the agent doing the work. This post walks through what that looks like in practice.

## So What Actually Goes Wrong?

Agents write pretty good code. Sometimes great code. What goes wrong is everything around it.

An agent finishes and says it's done. Is it? Who checked? The agent did. The thing doing the work is also grading the work, and it's very motivated to give itself an A.

Then there's drift. Long agent sessions get worse as they go. A model writes its best code early in a session and noticeably worse code later, once the context window is full of everything it tried and abandoned. Leave one running all night on a big feature and you come back to something that started smart and ended confused.

And then there's blast radius. An agent with access to your repo, your shell and your credentials can do a lot of damage while being very helpful.

So when you say "I don't trust it to run on its own," what you actually mean is something like:

- I don't trust it to decide what to build.
- I don't trust it to decide when it's done.
- I don't trust it near anything it can break.
- I don't trust it to know when to stop.
- And I need to see what it did without reading ten thousand lines of logs.

Each one of those has a specific answer in Specmarshal. Lets go through them.

## You decide what gets built

Specmarshal doesn't work from a prompt. It works from a **spec**: one feature, written down, with scenarios that describe what "working" looks like. The spec is broken into small **tickets**, each one a vertical slice with its own acceptance criteria and the tickets it waits on.

Small is on purpose. A ticket has to fit inside one agent's context window, in the good part of it. Every ticket gets a brand new agent process that is born, told one thing, and thrown away. Nothing carries a conversation from one ticket to the next. That's how you stay out of the dumb zone.

You don't have to write all of that by hand. `specmarshal plan` starts a planning session that grills the idea first, pushing back on it the way a reviewer would, then drafts the spec and tickets and shows you each one to approve, edit or reject.

A planned spec is written as `needs-triage`. An agent plans it. **A person marks it ready.** Nothing runs until somebody on your team says so.

On GitHub that's a label. A spec issue is ready while it carries `ready-for-agent` and not ready without it. And if anyone edits the body of a spec or ticket after the label went on, it stops being ready:

> the issue's body changed after it was made ready; apply ready-for-agent again to take the new text

So the text that gets worked is exactly the text a person approved.

Some work just shouldn't go to an agent. Production access, a live test against staging, a conversation with a vendor. Those tickets get `ready-for-human`. A person does them and closes them with a note on what they did, and that note gets handed to every ticket that was waiting on it. The agent picks up from the human's work instead of guessing at it.

There's one more check before any code gets written. The lead architect runs a **plan review** over the tickets. If the plan has work no ticket owns, or dependencies that loop back on themselves, the run stops before its first ticket and parks the spec for you. It doesn't build half a feature and discover the hole at 3am.

## The agent doesn't get a vote on done

When an agent finishes a ticket, its report might say "complete." Specmarshal treats that as information about the agent. Not about the code.

What actually decides is your **gate**. That's your own test suite, run with one command, `make verify`. Specmarshal runs it itself, after the agent is gone, on a fresh checkout of whatever the agent committed.

And the agent doesn't get to rewrite the gate. The Makefile decides what `make verify` actually runs, so before anything runs, the Makefile and Specmarshal's own settings get put back to the versions on the feature branch. If the agent changed them, it gets graded on the old ones anyway, and the run summary says it touched them, so whoever reads that diff knows to look hard at it. That one came from a real run, where an agent rewrote the Makefile partway through a ticket. It was a legit fix that time. Still not the call of the thing being graded.

Green tests still aren't done though. Green proves the repo still works. It doesn't prove the ticket got done. So a green gate only gets the ticket to a second agent, the **reviewer**, with a different job: read the ticket, read the diff, change nothing, and say whether each acceptance criterion is actually met. The review is the only thing in the whole system that can mark a ticket resolved.

Then once every ticket is closed, there's one more question. Do the slices actually add up to the spec? The reviewer reads the spec's scenarios against the whole feature branch. If they all hold, the run opens a pull request. If they don't, it opens a **draft** pull request instead, names each unmet scenario and why, and waits for a person.

I've had this happen on my own work. Specmarshal builds itself, its own features are specs and tickets like anyone else's. One of mine ran overnight, every ticket closed green and reviewed, and it still came back unsatisfied with 2 of 32 scenarios unmet. The draft PR said exactly which two. I'd much rather read that in the morning than find it in production.

## It can't touch what it can break

Every iteration runs in a sandbox of its own. The worker clones your project into a workspace inside the container, and works there. Your repository isn't reachable from in there. Neither is your home directory or anybody's personal agent config.

A run never commits to the branch you started from. Each ticket gets its own branch. Those merge into a feature branch for the spec. The feature branch becomes a pull request against your base branch. And then it stops.

Specmarshal does not merge. It does not deploy. It hands you reviewed branches and a pull request, and **landing it is your decision**. Your existing review process, your CODEOWNERS and your CI all still apply.

One more thing your security people will ask about. When Specmarshal parks a ticket on GitHub it posts a comment, and someone usually answers there. Those comments show up on Specmarshal's own pages so you can read the conversation. But a comment is never handed to an agent. Anyone who can reach the issue can write one, and an agent would read it as though it were the ticket. So that path just doesn't exist. If a person needs to tell the next attempt something, there's an **operator note** for that, and it goes through the same capability every other write does.

## It knows when to stop

An unattended agent that's stuck will happily keep trying forever, and you pay for every try.

Specmarshal counts three different kinds of trouble on each ticket, separately:

- **A red gate.** The code doesn't pass your tests. It gets a repair attempt aimed at the actual failure. Three by default.
- **A refused review.** Tests pass but the reviewer won't tick the criteria. That's a different problem, so it gets its own cap.
- **A conflicting merge.** Two tickets worked in parallel touched the same files. A lead architect phase tries to resolve it, the resolution gets gated again, and then re-read against every earlier ticket whose files it touched. A merge that quietly broke something already done is refused, however green it is. Own cap again.

When a cap runs out, the ticket is **parked**. Set aside, with a note saying which of those three got it there, and the run carries on with the rest. The run stops spending money on something that needs a human, and keeps going on everything else.

Then there are run-wide limits. An iteration budget, 50 phase invocations by default. And a dollar ceiling, `spend-ceiling`, $30 by default, counting what your model provider bills per token. Once the run reaches it, nothing new starts. And if Specmarshal can't tell what something cost, it treats the ceiling as reached rather than guessing you're fine.

When the standing service is running, a spec that ends badly (spent, deadlocked, unsatisfied, whatever) settles to `parked` and stays there. It doesn't get picked back up on the next poll. Re-admitting a spec that couldn't finish would just be a loop burning budget on the same failure. A person has to look at it and mark it ready again.

## You can see all of it

The service serves a web surface, and the whole page is built around one question: what needs a person? That's what the index leads with. Then a section per project, down to a page for each spec, run and ticket.

Spend sits next to the work it bought and the limit it counts against. A number Specmarshal couldn't read says so instead of showing up as zero. Reading is open. Anything that changes something, like releasing a parked ticket, holding a spec or leaving an operator note, needs the operator capability, and the irreversible stuff confirms first and tells you what it costs.

And every run leaves a full record behind: the event stream, each iteration's verbatim transcript, what the gate printed, what everything cost, and the commit it started from. When someone asks "why did it do that?" you can go read the actual answer.

You come in in the morning and within one screen you know what got delivered, what needs you, and what it cost.

## What this changes for your team

Specmarshal is only as good as your gate.

It won't judge your code beyond your tests and the acceptance criteria. If `make verify` is weak, a run will happily deliver code that passes a weak `make verify`. So put the first investment into your test suite, and into writing tickets with acceptance criteria someone could actually check. Which, lets be real, is stuff your team should be doing anyway.

What changes is where your people spend their time. Less typing out the slice. More of:

- Writing and triaging specs. Deciding what's worth building and what "done" means.
- Marking things ready. That's the authorization step, and it's a person's.
- Reading branches and pull requests. One ticket at a time, because each ticket's branch stays pushed after it merges.
- Picking up parked tickets, and the `ready-for-human` ones that were never going to an agent.

If you want to try it without committing to anything, start small. `specmarshal status` over a spec reads it and shows every ticket, its state, and what would start right now. No agent runs and it costs nothing. Then run one spec, a small one, on something you'd be happy to throw away. Point it at the spec in the evening. Read the branches in the morning. See if you agree with the reviewer.

## So where can you get it?

Not yet. Specmarshal is in private alpha. There's nothing to sign up for right now, and the [product page](/products/specmarshal) will say when there is. I'll keep writing here about how it's built, since it's mostly built by itself, under exactly the rules above.

## TLDR

You don't have to trust the agent.

- **People decide what gets built.** Specs and tickets, planned by an agent, marked ready by a person. Change the text and it isn't ready anymore.
- **Your tests decide what works.** The gate runs after the agent is gone, on a tree it never touched, with the Makefile swapped back in.
- **A separate reviewer decides what's done.** Ticket by ticket, and then the whole spec against its scenarios. Short of it? Draft PR.
- **Nothing touches your repo.** Sandboxed, one fresh process per ticket, and it hands you a pull request. Merging is yours.
- **It stops itself.** Caps per ticket, a budget and a dollar ceiling per run, and parked work waits for a person.
- **You can see everything.** What needs you first, spend next to the work, and a full record of every run.

Well, thats about it for now. Go fix your test suite. You're going to need it.
