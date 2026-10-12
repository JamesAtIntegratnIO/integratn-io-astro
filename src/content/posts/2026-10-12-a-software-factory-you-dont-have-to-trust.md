---
title: "A Software Factory You Don't Have to Trust"
pubDate: 2026-10-12T13:00:00.000Z
tags: [ai, ai-agent, agentic-development, specmarshal, engineering-leadership]
categories: [workflow]
heroImage: /og/blog/2026-10-12-a-software-factory-you-dont-have-to-trust.png
card: /og/blog/2026-10-12-a-software-factory-you-dont-have-to-trust.png
description: "For the CTO who wants agents building overnight but won't let them run unchecked: how Specmarshal keeps people in charge of what gets built, what counts as done, and what ships."
---

So you're a CTO. Or you run engineering, or you're the person who gets asked "what's our AI strategy" in every leadership meeting. You've watched the demos. You've seen an agent knock out a feature in twenty minutes, and you've probably seen one tell you the tests pass when it never ran them.

You want the speed. You want the "software factory" thing where work goes in one end and branches come out the other while your team sleeps. But you don't trust it to run on its own, and you're right not to.

I built [Specmarshal](/products/specmarshal) around that distrust. In Specmarshal the agent writes the code, and that's all it decides. Your tests, a separate reviewer and the people on your team make every other call.

## So what goes wrong?

Agents write pretty good code. Sometimes great code. The trouble is everything around the code.

An agent finishes and says it's done. Who checked? The agent did. The thing doing the work is grading the work, and it's very motivated to give itself an A.

Then there's drift. A model writes its best code early in a session and worse code later, once the context window is full of everything it tried and abandoned. Leave one running all night on a big feature and you come back to something that started smart and ended confused.

And there's blast radius. An agent with your repo, your shell and your credentials can do a lot of damage while trying very hard to help.

So "I don't trust it to run on its own" usually breaks down like this:

- I don't trust it to decide what to build.
- I don't trust it to decide when it's done.
- I don't trust it near anything it can break.
- I don't trust it to know when to stop.
- I need to see what it did without reading ten thousand lines of logs.

Specmarshal has an answer for each one.

## You decide what gets built

Specmarshal works from a **spec**: one feature, written down, with scenarios that describe what working looks like. The spec is broken into small **tickets**. Each one is a vertical slice with its own acceptance criteria and a list of the tickets it waits on.

Tickets are small on purpose. A ticket has to fit in the good part of one agent's context window. Every ticket gets a brand new agent process that's started, told one thing, and thrown away, and no conversation carries over from one ticket to the next. That's how you stay out of the dumb zone.

You don't have to write all of that by hand. A planning session grills the idea first, pushing back on it like a reviewer would. Then it drafts the spec and tickets and shows you each one to approve, edit or reject.

A planned spec comes out as `needs-triage`. An agent plans it and a person marks it ready. Nothing runs until somebody on your team says so.

On GitHub, ready is a label. A spec issue is ready while it carries `ready-for-agent`. If anyone edits the body of a spec or ticket after the label went on, it stops being ready:

> the issue's body changed after it was made ready; apply ready-for-agent again to take the new text

So the text that gets worked is the text a person approved.

Some work shouldn't go to an agent at all: production access, a live test against staging, a call with a vendor. Those tickets get `ready-for-human`. A person does the work and closes the ticket with a note on what they did, and Specmarshal hands that note to every ticket that was waiting on it. The agent starts from what the human actually found.

Before any code gets written, the lead architect runs a **plan review** over the tickets. If the plan has work no ticket owns, or dependencies that loop back on themselves, the run stops before its first ticket and parks the spec for you. You find the hole before half a feature gets built around it.

## The agent doesn't get a vote on done

When an agent finishes a ticket, its report might say "complete." Specmarshal reads that as a claim the agent made and checks the code anyway.

The check is your **gate**, which is your own test suite run with one command, `make verify`. Specmarshal runs it itself, after the agent is gone, on a fresh checkout of whatever the agent committed.

The agent doesn't get to rewrite the gate either. The Makefile decides what `make verify` runs, so before anything runs, the Makefile and Specmarshal's own settings get put back to the versions on the feature branch. If the agent changed them, it gets graded on the old ones anyway, and the run summary says it touched them so whoever reads that diff knows to look hard at it. That rule came from a real run, where an agent rewrote the Makefile partway through a ticket. It was a legit fix that time. Still not the call of the thing being graded.

Green tests only prove the repo still works. They don't prove the ticket got done. So a green gate sends the ticket to a second agent, the **reviewer**, which reads the ticket and the diff, changes nothing, and says whether each acceptance criterion is met. The review is the only thing in the whole system that can mark a ticket resolved.

Once every ticket is closed, the reviewer reads the spec's scenarios against the whole feature branch, because a pile of finished slices can still miss the feature. If every scenario holds, the run opens a pull request. If any don't, it opens a **draft** pull request that names each unmet scenario and why, and waits for a person.

I've had this happen on my own work. Specmarshal builds itself, so its features are specs and tickets like anyone else's. One of mine ran overnight, every ticket closed green and reviewed, and it still came back unsatisfied with 2 of 32 scenarios unmet. The draft PR said exactly which two. I'd much rather read that in the morning than find it in production.

## It can't touch what it can break

Specmarshal runs as a service on your Kubernetes cluster, installed with a Helm chart. Every iteration gets a Job of its own: one pod running your project's sandbox image, thrown away when the iteration ends. The gate runs in a separate pod. The code goes in and comes back out as a git bundle, never as a mounted volume or a remote the agent can push to.

A run never commits to the branch you started from. Each ticket gets its own branch, those merge into a feature branch for the spec, and the feature branch becomes a pull request against your base branch. Then the run stops.

Specmarshal doesn't merge and it doesn't deploy. It hands you reviewed branches and a pull request, and landing it is your call. Your review process, your CODEOWNERS and your CI all still apply.

Your security people will ask about prompt injection. When Specmarshal parks a ticket on GitHub it posts a comment, and someone usually answers there. Those comments show up on Specmarshal's own pages so you can follow the conversation, but they're never handed to an agent. Anyone who can reach the issue can write a comment, and an agent would read it as though it were the ticket. If a person needs to tell the next attempt something, that's what an **operator note** is for, and writing one takes the same operator access as every other change.

## It knows when to stop

An unattended agent that's stuck will keep trying forever, and you pay for every try.

Specmarshal counts three kinds of trouble on each ticket, and caps each one separately. A red gate means the code doesn't pass your tests, so the ticket gets a repair attempt aimed at the actual failure, three by default. A refused review means the tests pass but the reviewer won't tick the criteria. That's a different problem, so it has its own cap.

The third is a conflicting merge, when two tickets worked in parallel touched the same files. A lead architect phase tries to resolve it. The resolution goes through the gate again and then gets re-read against every earlier ticket whose files it touched, and a merge that broke something already done is refused, however green it is. That one has its own cap too.

When a cap runs out, the ticket is **parked**: set aside with a note saying which kind of trouble got it there. The run stops spending money on that ticket and keeps going on the rest.

Then there are limits on the whole run. The iteration budget is 50 phase invocations by default. The dollar ceiling, `spend-ceiling`, is $30 by default and counts what your model provider bills per token. Once a run reaches it, nothing new starts. If Specmarshal can't tell what something cost, it treats the ceiling as reached instead of assuming you're under it.

The service polls your projects for specs marked ready. A spec that ends badly (out of budget, deadlocked, unsatisfied, whatever) settles to `parked` and stays there. The next poll doesn't pick it back up, because re-running a spec that couldn't finish would just burn budget on the same failure. A person has to look at it and mark it ready again.

## You can see all of it

The service has a web view, and every page leads with what needs a person. The index opens with that, then a section per project, down to a page for each spec, run and ticket.

Spend sits next to the work it bought and the limit it counts against. A number Specmarshal couldn't read is shown as unknown, not as zero. Anyone with the link can read. Changing anything (releasing a parked ticket, holding a spec, leaving an operator note) takes operator access, and anything you can't undo asks first and tells you what it costs.

Every run also leaves a full record: the event stream, each iteration's transcript word for word, what the gate printed, what everything cost and the commit it started from. When someone asks "why did it do that?" you can go read the answer.

You come in in the morning and one screen tells you what got delivered, what needs you, and what it cost.

## What this changes for your team

Specmarshal is only as good as your gate.

It won't judge your code beyond your tests and the acceptance criteria. If `make verify` is weak, a run will happily deliver code that passes a weak `make verify`. So spend first on your test suite, and on writing acceptance criteria someone could actually check. Which, lets be real, your team should be doing anyway.

Your people spend less time typing out the slice and more time on:

- Writing and triaging specs, which means deciding what's worth building and what done means.
- Marking things ready. That's the sign-off, and a person gives it.
- Reading branches and pull requests one ticket at a time, since each ticket's branch stays pushed after it merges.
- Picking up parked tickets, and the `ready-for-human` ones that were never going to an agent.

If you want to kick the tires, start small. Pick one small spec on a repo you'd be happy to throw away. Mark it ready in the evening, read the branches in the morning, and see if you agree with the reviewer.

## Where can I get it?

Not yet. Specmarshal is in private alpha, so there's no signup. Watch the [product page](/products/specmarshal) or this blog. I'll keep posting here about how it's built.

## TLDR

You don't have to trust the agent.

- People decide what gets built. An agent plans the spec and tickets, a person marks them ready, and editing the text takes the ready mark off.
- Your tests decide what works. The gate runs after the agent is gone, on a fresh checkout, with the Makefile put back.
- A separate reviewer decides what's done, ticket by ticket and then the whole spec against its scenarios. If it falls short you get a draft PR.
- Nothing touches your repo. Each ticket gets a fresh pod on your cluster, and you get a pull request to merge or not.
- It stops itself, with caps per ticket, a budget and a dollar ceiling per run, and parked work that waits for a person.
- You can see what needs you, what it spent and a full record of every run.

Well, thats about it for now. Go fix your test suite. You're going to need it.
