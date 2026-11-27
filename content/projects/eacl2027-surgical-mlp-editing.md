---
title: "Surgical MLP Editing for Unlearning with Cross-Layer Transcoders"
date: 2026-11-25
draft: false
tags: ["machine-unlearning", "mechanistic-interpretability", "large-language-models"]
summary: "EACL 2027 — Sangjin Kim*, Jun-Hyun Bae*, Heechul Jung"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/videos/eacl2027-surgical-mlp-editing.jpg"
  alt: "Surgical MLP Editing with Cross-Layer Transcoders"
  hidden: true
---

{{< paper-header
  venue="EACL 2027"
  authors="Sangjin Kim*, <strong>Jun-Hyun Bae</strong>*, Heechul Jung"
  affil="Kyungpook National University"
  note="* Equal Contribution"
>}}

{{< video src="/videos/eacl2027-surgical-mlp-editing.mp4" poster="/videos/eacl2027-surgical-mlp-editing.jpg" caption="Cross-Layer Transcoder로 대상 지식을 찾고 MLP 출력에서 정밀 제거·증류하는 과정" >}}

## Abstract

As large language models lower the barrier to accessing scientific and technical knowledge, they also increase the need for unlearning methods that reduce targeted hazardous capabilities while preserving broad utility. Most existing unlearning methods optimize losses on forget and retain sets, but do not identify the internal computations that give rise to the resulting behavioral change. Motivated by prior work showing that Transformer MLP blocks store and mediate factual knowledge, we frame unlearning as a problem of modifying feature-level contributions to MLP outputs. We propose a method for identifying target-associated MLP-level features using a Cross-Layer Transcoder (CLT), converting their decoder contributions into feature-removed MLP-output targets, and training MLP parameters to match those targets. Our method substantially reduces WMDP-Bio accuracy while maintaining performance close to the original model on retain benchmarks. Additional MLP-output probe and semantic-grouped generation analyses help characterize which behaviors are attenuated by the learned update. These results suggest that CLT-guided unlearning offers a practical mechanistic route toward targeted unlearning in language models.

---

## Overview

기존 LLM unlearning은 forget set과 retain set에 손실을 걸어 모델을 업데이트한다. 목표 벤치마크 점수는 내려가지만, 모델 안에서 무엇이 바뀌었는지는 알기 어렵다. 여기서는 사실 지식을 저장하고 처리한다고 알려진 MLP 블록에 초점을 맞추고, unlearning을 MLP 출력을 이루는 feature 단위 기여 중 대상 지식과 관련된 것을 지우는 문제로 본다.

이를 위해 Cross-Layer Transcoder(CLT)를 쓴다. CLT는 각 층 MLP의 입력을 sparse feature로 인코딩하고, 그 층과 이전 층에서 켜진 feature들의 decoder 기여를 더해 MLP 출력을 복원한다. forget corpus에서 유독 많이 켜지는 feature를 골라 그 decoder 기여를 뺀 출력을 만들고, MLP가 이 출력을 내도록 학습한다. CLT는 학습할 때만 쓰므로, 학습이 끝난 모델은 CLT나 activation hook 없이 보통의 forward pass로 동작한다. Gemma-2-2B에서 WMDP-Bio 정확도는 56.79%에서 34.72%로 내려갔고, retain 벤치마크는 원래 모델에 가까운 수준을 유지했다.

![CLT-guided MLP unlearning](/images/eacl2027/clt-mlp-unlearning.png)

<p class="caption">
CLT 기반 unlearning 개요. CLT feature로 대상 능력과 관련된 MLP 수준 기여를 찾고, 해당 decoder 기여를 제거한 뒤, 그 결과를 MLP 파라미터에 distill한다.
</p>

---

## Method

### Cross-Layer Transcoder

층 $\ell$에서 MLP 직전의 layer-normalized hidden state를 $\mathbf{x}^{\ell}$, residual에 더해지기 전의 MLP 출력을 $\mathbf{y}^{\ell}$이라 하자. CLT encoder는 음이 아닌 sparse feature activation을 계산하고, decoder는 현재 층과 이전 층 feature의 기여를 더해 MLP 출력을 복원한다.

$$\textcolor{#A86A14}{\mathbf{a}^{\ell}} = \phi\!\left(\mathbf{x}^{\ell}W^{\ell}_{\mathrm{enc}}\right), \qquad \widehat{\mathbf{y}}^{\ell} = \sum_{\ell' \leq \ell} \textcolor{#A86A14}{\mathbf{a}^{\ell'}} W_{\mathrm{dec}}^{\ell'\rightarrow\ell}$$

$\widehat{\mathbf{y}}^{\ell}$은 실제 MLP 출력 $\mathbf{y}^{\ell}$의 근사다. $\mathbf{a}^{\ell'}$을 일부 feature로 제한하고 $W_{\mathrm{dec}}^{\ell'\rightarrow\ell}$을 곱하면, 그 feature들이 층 $\ell$의 출력에 더한 몫이 나온다. 우리는 이 decoder 기여를 unlearning의 기본 단위로 쓴다.

### 제거할 feature 고르기

forget corpus와 retain corpus($c \in \{f, r\}$)에서 CLT activation 통계를 모은다. 층 $\ell$의 feature $i$에 대해 $P^{c}_{i,\ell}$은 feature가 켜진 토큰 수, $M^{c}_{i,\ell}$은 activation 합(activation mass)이다.

$$\mathrm{score}_{i,\ell} = \textcolor{#B84327}{M^{f}_{i,\ell}} - \textcolor{#1E4E79}{M^{r}_{i,\ell}}, \qquad R_{i,\ell} = \frac{\textcolor{#B84327}{M^{f}_{i,\ell}}}{\textcolor{#1E4E79}{M^{r}_{i,\ell}}+1}$$

forget corpus에서 충분히 자주 켜지고, $R$이 크며, score가 양수인 feature만 남긴다. 그다음 켜진 토큰 수 차이($P^f - P^r$)로 후보를 추리고, score로 다시 순위를 매겨 층마다 후보 집합을 만든다. 후보 score의 합이 큰 층 중에서 forget corpus에서의 전체 CLT 활동이 retain보다 많은 층만 source layer로 고른다.

activation 통계만으로는 feature가 대상 지식에 특화됐는지 알 수 없다. 그래서 각 후보 feature가 강하게 켜지는 WikiText-103 문장을 보고 의미를 검토한다. 일반 문맥, 문법·숫자 패턴, 뒤섞인 의미를 보이는 feature는 빼고, 대상에 특화된 의미가 반복되는 feature만 남겨 제거 집합 $\mathcal{F}_{\mathrm{rm}}$을 만든다.

### CLT 기반 MLP distillation

CLT feature를 추론 때 직접 끄려면 매번 CLT를 호출하고 activation hook을 걸어야 한다. 대신 CLT는 학습 중 목표 출력을 만드는 데만 쓰고, 그 목표를 MLP 가중치에 distill한다. 가장 앞선 source layer $\ell_{\min}$부터 마지막 층까지 $\mathcal{T}=\{\ell_{\min},\ldots,L-1\}$의 MLP만 학습하고 나머지는 고정한다.

source layer $\ell_s$에서 $\mathcal{F}_{\mathrm{rm}}$에 속한 좌표만 남긴 activation을 $\mathbf{a}^{\ell_s}_{\mathrm{rm}}$이라 하면, 이 feature들이 층 $\ell_t \geq \ell_s$에 더한 몫은 $\Delta \mathbf{y}_{\mathrm{rm}}^{\ell_s\rightarrow \ell_t} = \mathbf{a}^{\ell_s}_{\mathrm{rm}} W_{\mathrm{dec}}^{\ell_s\rightarrow \ell_t}$이다. forget 예제의 목표 출력은 층 종류에 따라 다르게 만든다.

$$\textcolor{#634294}{\widetilde{\mathbf{y}}^{\ell_t}_{\mathrm{rm}}} = \textcolor{#A86A14}{\mathbf{a}^{\ell_t} W_{\mathrm{dec}}^{\ell_t\rightarrow \ell_t}} - \textcolor{#B84327}{\alpha\, \Delta \mathbf{y}_{\mathrm{rm}}^{\ell_t\rightarrow \ell_t}} \quad (\ell_t \in \mathcal{L}_{\mathrm{source}})$$

$$\textcolor{#634294}{\widetilde{\mathbf{y}}^{\ell_t}_{\mathrm{rm}}} = \mathbf{y}^{\ell_t}_{\mathrm{orig}} - \textcolor{#B84327}{\alpha} \sum_{\substack{\ell_s\in\mathcal{L}_{\mathrm{source}}\\ \ell_s<\ell_t}} \textcolor{#B84327}{\Delta \mathbf{y}_{\mathrm{rm}}^{\ell_s\rightarrow \ell_t}} \quad (\ell_t \notin \mathcal{L}_{\mathrm{source}})$$

{{< clt-surgery-widget >}}

source layer에서는 같은 층 decoder 기여에서 선택 feature의 몫을 빼며, $\alpha=1$이면 그 feature들을 0으로 만드는 것과 같다. 그 밖의 층은 원래 MLP 출력에서, 앞선 source layer의 선택 feature가 보낸 기여만 뺀다. retain 예제의 목표는 원래 모델의 MLP 출력 $\mathbf{y}_{\mathrm{orig}}$ 그대로다. 두 목표에 대한 masked MSE를 합쳐 학습한다.

$$\mathcal{L} = \textcolor{#B84327}{\mathcal{L}_{\mathrm{forget}}} + \lambda\, \textcolor{#2A6F4E}{\mathcal{L}_{\mathrm{retain}}}$$

---

## Results

### Unlearning과 retain 성능

대상 벤치마크는 WMDP-Bio이고, retain 성능은 MMLU 고교 생물(HS Bio), 대학 생물(College Bio), 57개 과목에서 10문항씩 뽑은 MMLU-10으로 잰다. GPT-OSS-20B에는 앞쪽 source layer의 MLP를 먼저 업데이트해 넣고, 그 상태에서 뒤쪽 MLP를 학습하는 순차 업데이트 변형을 적용했다.

<p class="caption">
Multiple-choice accuracy (%). 굵은 글씨는 모델별로 unlearning 방법 중 가장 좋은 값이다.
</p>

| Model | Method | WMDP-Bio ↓ | HS Bio ↑ | College Bio ↑ | MMLU-10 ↑ |
|:---|:---|:---:|:---:|:---:|:---:|
| Gemma-2-2B | *Original* | *56.79* | *63.23* | *59.72* | *50.53* |
| | GA | 24.67 | 17.74 | 25.69 | 26.14 |
| | GD | 24.67 | 27.74 | 38.89 | 29.82 |
| | KL | 25.22 | 47.10 | 54.17 | 37.54 |
| | NPO | 45.25 | 60.65 | 56.94 | 45.79 |
| | RMU | **24.35** | 43.87 | 44.44 | 34.56 |
| | CRISP (SAE) | 39.12 | 61.29 | 54.86 | **50.88** |
| | DSG (SAE) | 39.36 | 55.16 | 45.83 | 49.65 |
| | **Ours** | 34.72 | **64.19** | **59.03** | 48.77 |
| GPT-OSS-20B | *Original* | *77.77* | *81.94* | *88.89* | *70.00* |
| | GA | **24.04** | 31.61 | 26.39 | 24.21 |
| | GD | 28.20 | 37.42 | 34.72 | 36.84 |
| | KL | **24.04** | 31.61 | 26.39 | 25.44 |
| | NPO | 38.81 | 37.10 | 39.58 | 37.54 |
| | RMU | 65.51 | 73.87 | 77.78 | 65.96 |
| | **Ours** | 39.67 | **79.68** | **83.33** | **68.60** |

Gemma-2-2B에서 WMDP-Bio는 56.79%에서 34.72%로 내려가, SAE 기반 방법인 CRISP(39.12%)와 DSG(39.36%)보다 낮다. GA·GD·KL·RMU는 WMDP-Bio를 24–25%까지 낮추지만 retain 정확도가 더 많이 떨어진다. 이 방법의 retain 정확도는 원래 모델과 가깝고(HS Bio 64.19%, College Bio 59.03%, MMLU-10 48.77%), MMLU-10에서는 CRISP(50.88%)가 조금 더 높다. GPT-OSS-20B에서는 WMDP-Bio가 77.77%에서 39.67%로 내려가면서 retain 정확도를 GA·GD보다 훨씬 잘 지키고, RMU(65.51%)보다 대상 지식을 더 많이 억제한다. 5-shot 프롬프트로 평가해도 두 모델 모두 원래 모델보다 WMDP-Bio 정확도가 크게 낮다.

### 모델 내부 분석

**MLP 출력 probe.** 각 문항의 마지막 답 위치에서 MLP 출력을 꺼내, 정답 보기(A–D)를 맞히는 linear probe를 학습한다. 원래 모델과 unlearning 모델의 MLP 출력에서 각각 probe를 학습해 정확도를 비교하면, 직접 바꾼 MLP 출력에서 WMDP-Bio 정답 정보가 얼마나 줄었는지 층별로 볼 수 있다. retain 쪽은 MMLU 고교 생물로 같은 비교를 한다. 이 probe 결과와 아래 생성 평가는 학습된 변화가 최종 출력에만 머무는 것이 아니라 수정된 MLP 출력 자체에도 반영된다는 근거가 된다.

**의미 그룹별 생성 평가.** 선택된 feature가 forget corpus에서 켜지는 반복 문맥으로 의미 그룹을 만들고, 그룹마다 짧은 문장 앞부분을 써서 원래 모델과 unlearning 모델의 이어 쓰기를 비교했다. LLM judge가 매긴 점수로 보면 대상 그룹에서는 생성 내용이 약해졌고, retain 대조 그룹의 점수 변화는 0 근처이거나 음수였다. 모든 프롬프트에서 고르게 약해진 것이 아니라, 선택된 feature와 관련된 의미 영역에서 약해졌다는 뜻이다.

### 한계

이 방법을 완전한 생물 보안 장치로 해석해서는 안 된다. WMDP-Bio는 객관식 벤치마크라서, 실제 오용 경로나 바꿔 묻기, 여러 턴에 걸친 유도, 재학습을 다 반영하지 못한다. 선택된 feature는 검토를 거친 후보이지 완전한 인과 회로가 아니다. 쓸 만한 CLT checkpoint가 있는 모델에만 적용할 수 있고, GPT-OSS-20B는 비교용 SAE를 학습할 수 없어서 SAE 기반 baseline을 보고하지 않았다.

---
