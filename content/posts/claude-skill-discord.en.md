---
title: "Sending Discord Notifications from Claude Code"
date: 2026-02-08T15:53:00+09:00
draft: false
tags: ["claude-code", "discord", "open-source", "tool"]
summary: "A Claude Code skill that sends experiment results, files, and rich embeds to Discord channels."
---

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://github.com/JunhyunB/claude-skill-discord" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg> GitHub</a>
</div>

## Motivation

Recently, tools like Clawdbot, Moltbot, and OpenClaw have gained popularity, and my favorite feature is being able to access agents through Discord channels. I tried them out, but the problem is you end up using the OpenClaw agent, not Claude Code. I didn't want to give up Claude Code's strengths — Hooks, Subagents, Agent Teams.

In practice, I don't always want to run experiments entirely through Discord. What I really want is: when I kick off an experiment on a server and step away, I want to know immediately when results are ready. Now that my research workflow has centered around Claude Code, **the ideal is just saying "send the results to Discord when this experiment finishes" inside Claude Code**.

So I built a Discord webhook notification skill for Claude Code.

## Features

- **Text messages** — Markdown support
- **Rich Embeds** — Title, description, color, fields, timestamps
- **File attachments** — Up to 10 files, 25MB each
- **Raw JSON** — Full Discord webhook API access
- **Session Handoff** — Hand off Claude Code CLI sessions to Discord bots
- **Custom bot name/avatar, thread support**

## Usage

### Inside Claude Code

Just ask in natural language — the `/sc:discord` skill is invoked automatically:

```
"Send results to Discord"
"Share the training curve on Discord"
"Hand off this session to Discord"
```

### CLI direct usage

```bash
# Text
discord-notify "Hello world"

# Embed
discord-notify --embed "Experiment Done" "Accuracy: 87.3%" 5793266

# File attachment
discord-notify --file ./loss_curve.png "Training results"

# Multiple files
discord-notify --files loss.png acc.csv -- "All results"

# Pipe input
cat results.txt | discord-notify
```

### ML experiment results example

```bash
discord-notify --name "Lab Bot" --rich '{
  "embeds": [{
    "title": "Experiment Complete",
    "color": 5793266,
    "fields": [
      {"name": "Model", "value": "ResNet-50", "inline": true},
      {"name": "Accuracy", "value": "87.3 ± 0.2%", "inline": true},
      {"name": "Baseline", "value": "85.1%", "inline": true}
    ],
    "footer": {"text": "seeds: 42,43,44 | p < 0.01"}
  }]
}'
```

## Installation

```bash
git clone https://github.com/JunhyunB/claude-skill-discord.git
cd claude-skill-discord
./install.sh
```

Create a webhook URL in your Discord server settings and enter it during installation.
