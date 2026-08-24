---
title: "Claude Code에서 Discord로 알림 보내기"
date: 2026-02-08T15:53:00+09:00
draft: false
tags: ["claude-code", "discord", "open-source", "tool"]
summary: "Claude Code skill로 실험 결과, 파일, 임베드를 Discord 채널에 바로 전송하는 도구를 만들었다."
---

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://github.com/JunhyunB/claude-skill-discord" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg> GitHub</a>
</div>

## 동기

최근 매우 핫해진 Clawdbot, Moltbot, OpenClaw에서 내가 제일 마음에 드는 기능은 디스코드 채널을 통해 내가 쓰는 에이전트에 접근할 수 있다는 점이다. 나도 설치해서 사용해 봤지만, Claude Code가 아닌 OpenClaw 에이전트를 사용하게 된다. Claude Code의 강점인 Hook, Subagents, Agent Teams 같은 기능들을 또 포기하고 싶지도 않다.

사실 항상 디스코드를 사용해서 실험을 수행한다기 보다는, 서버에서 실험을 돌려놓고 자리를 비울 때, 경과나 결과가 나오면 바로 알고 싶다는 쪽이 더 나에게 맞다고 생각된다. 연구 워크플로우의 중심이 Claude Code로 옮겨간 지금은 **Claude Code 안에서 "지금 돌아가는 실험이 끝나면 결과를 디스코드로 보내줘" 한마디면 되는 게 이상적**이다.

그래서 Claude Code의 Discord webhook 기반 알림 skill을 만들었다.

## 주요 기능

- **텍스트 메시지** — Markdown 지원
- **Rich Embed** — 제목, 설명, 색상, 필드, 타임스탬프
- **파일 첨부** — 최대 10개, 각 25MB
- **Raw JSON** — Discord webhook API 전체 접근
- **Session Handoff** — Claude Code CLI 세션을 Discord 봇에 넘기기
- **커스텀 봇 이름/아바타, 스레드 지원**

## 사용법

### Claude Code 안에서

자연어로 요청하면 자동으로 `/sc:discord` skill이 호출된다:

```
"디스코드로 결과 보내줘"
"학습 곡선 이미지 디스코드에 공유해"
"이 세션 디스코드 봇한테 넘겨줘"
```

### CLI에서 직접

```bash
# 텍스트
discord-notify "Hello world"

# 임베드
discord-notify --embed "실험 완료" "Accuracy: 87.3%" 5793266

# 파일 첨부
discord-notify --file ./loss_curve.png "학습 결과"

# 여러 파일
discord-notify --files loss.png acc.csv -- "전체 결과"

# 파이프 입력
cat results.txt | discord-notify
```

### ML 실험 결과 예시

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

## 설치

```bash
git clone https://github.com/JunhyunB/claude-skill-discord.git
cd claude-skill-discord
./install.sh
```

Discord 서버 설정에서 webhook URL을 만들어 입력하면 끝이다.
