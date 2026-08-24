---
title: "Learning Associative Reasoning Towards Systematicity Using Modular Networks"
date: 2022-11-01
draft: false
tags: ["associative-reasoning", "systematic-generalization", "modular-networks"]
summary: "ICONIP 2022 — Jun-Hyun Bae*, Taewon Park*, Minho Lee"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/iconip2022/main-figure.webp"
  alt: "Modular TPR architecture"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">ICONIP 2022</span><br>
<span style="color: var(--secondary);"><strong>Jun-Hyun Bae</strong>*, Taewon Park*, Minho Lee<br>
Kyungpook National University<br>
<small>* Equal Contribution</small></span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://link.springer.com/chapter/10.1007/978-3-031-30108-7_10" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Paper</a>
</div>

## Abstract

Learning associative reasoning is necessary to implement human-level artificial intelligence even when a model faces unfamiliar associations of learned components. However, conventional memory augmented neural networks (MANNs) have shown degraded performance on systematically different data since they lack consideration of systematic generalization. In this work, we propose a novel architecture for MANNs which explicitly aims to learn recomposable representations with a modular structure of RNNs. Our method binds learned representations with a Tensor Product Representation (TPR) to manifest their associations and stores the associations into TPR-based external memory. In addition, to demonstrate the effectiveness of our approach, we introduce a new benchmark for evaluating systematic generalization performance on associative reasoning, which contains systematically different combinations of words between training and test data. From the experimental results, our method shows superior test accuracy on systematically different data compared to other models. Furthermore, we validate the models using TPR by analyzing whether the learned representations have symbolic properties.

---

## Overview

기존 MANN이 체계적으로 다른 테스트 데이터에서 실패하는 문제를 해결하기 위해, modular encoder와 TPR 기반 외부 메모리를 결합한 새로운 아키텍처를 제안한다.

1. **Modular encoding** — Recurrent Independent Mechanisms(RIMs)로 입력을 $N$개 독립 모듈이 경쟁적으로 인코딩하여 재조합 가능한 표현을 학습한다.
2. **TPR binding** — Tensor Product Representation으로 role과 filler의 연관 관계를 수학적으로 바인딩한다: $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$
3. **Memory-based recall** — TPR 기반 외부 메모리에 연관 관계를 저장하고, 학습하지 않은 조합에서도 체계적으로 추론한다.

![Modular TPR Architecture](/images/iconip2022/main-figure.webp)

<p class="caption">
전체 아키텍처. 각 시점 $t$마다 입력은 modular encoder를 통과하여 role $r_t$와 filler $f_t$로 분리되고, TPR binding($\otimes$)으로 외부 메모리 $\mathbf{M}_t$에 누적된다. 질의 시에는 동일한 encoder가 query role $q_r$을 생성해 메모리에서 해당 filler를 unbind한다.
</p>

---

## Method

기존 memory augmented neural network (MANN)는 학습 데이터와 체계적으로 다른(systematically different) 테스트 데이터에서 성능이 급락한다. 핵심 원인은 encoder가 학습된 조합에 과적합하여, 개별 구성 요소를 재조합 가능한(recomposable) 형태로 표현하지 못하기 때문이다. 이를 해결하기 위해 **modular RNN encoder + TPR-based external memory**를 결합한다.

**핵심 구성:**
- **Recurrent Independent Mechanisms (RIMs)**: $N$개의 RNN 모듈이 competitive learning으로 각자 독립적인 인코딩 메커니즘 학습
- **Tensor Product Representation (TPR)**: role과 filler의 tensor product로 연관 관계를 수학적으로 바인딩 — $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$
- **TPR-based External Memory**: 각 시간 단계에서 role/filler 표현을 추출하여 메모리에 superpose. 쓰기 규칙은 write strength $\beta = \sigma(W_\beta h_t)$를 사용한 delta-filler 형태로, $\mathbf{M}_t = \mathbf{M}_{t-1} + \mathbf{r}_t \otimes (\beta \mathbf{f}_t - (1-\beta) \mathbf{f}_{t-1})$이다.
- **Systematic Associative Recall (SAR)**: 체계적 일반화 평가를 위한 새 벤치마크 제안

---

## Results

### Systematic Associative Recall (SAR) Task

SAR은 본 논문에서 제안하는 벤치마크로, associative reasoning에서의 체계적 일반화를 측정하기 위해 설계되었다. 세 가지 객체 집합(사람 이름 $S_h$, 과일 이름 $S_f$, 숫자 이름 $S_n$)을 사용하며, 학습 데이터와 테스트 데이터 간에 **객체 조합을 체계적으로 다르게** 구성한다.

구체적으로, $S_h$의 일부($S_h^1$)는 학습 시 숫자와만 연관되고, 다른 일부($S_h^2$)는 과일과만 연관된다. **test (different)**에서는 이 관계가 역전되어, $S_h^1$은 과일과, $S_h^2$는 숫자와 연관된다. 난이도 파라미터 $p = |S_h^3| / |S_h|$는 두 집합 모두와 연관되는 객체의 비율로, 값이 작을수록 학습/테스트 간 체계적 차이가 크다.

<div style="margin: 1.5rem 0;">
<div style="text-align: center;">
<img src="/images/iconip2022/dnc.webp" alt="DNC accuracy on SAR">
<p class="caption">(a) DNC</p>
</div>
<div style="text-align: center;">
<img src="/images/iconip2022/fwm.webp" alt="FWM accuracy on SAR">
<p class="caption">(b) FWM</p>
</div>
<div style="text-align: center;">
<img src="/images/iconip2022/ours.webp" alt="Ours accuracy on SAR">
<p class="caption">(c) Ours</p>
</div>
</div>

<p class="caption">SAR 태스크에서 DNC, FWM, 제안 방법의 학습/테스트 정확도 비교.</p>

DNC와 FWM은 test (same)에서는 높은 정확도를 보이지만, test (different)에서는 큰 성능 저하를 보인다. 이는 학습된 조합에 과적합하여 체계적 일반화에 실패하는 것이다. 제안 방법은 $p=0.3$ 및 $p=0.5$에서 test (same)과 test (different) 간의 격차를 성공적으로 해소하며, 가장 어려운 $p=0.1$에서도 baseline 대비 현저히 작은 격차를 보인다. FWM이 TPR 기반 메모리를 사용함에도 불구하고 체계적 일반화에 실패한다는 것은, TPR 메모리만으로는 충분하지 않으며 **encoder가 올바른 symbolic representation을 학습하는 것**이 핵심임을 시사한다.

### Concatenated-bAbI (catbAbI)

SAR이 체계적 일반화에 초점을 맞춘 반면, catbAbI는 일반적인 장기 연관 추론 성능을 평가한다. 무한 길이의 story sequence에서 질의응답을 수행하는 태스크이다.

| Model | Test Accuracy |
|---|---|
| LSTM | 80.88% |
| Transformer-XL | 87.66% |
| Meta-learned Neural Memory | 88.97% |
| Fast Weight Memory (FWM) | **96.75%** |
| FWM (our trial) | 94.94% |
| **Ours** | 96.63% |

동일한 실험 세팅(our trial)에서 비교하면, 제안 방법(96.63%)이 FWM(94.94%)보다 1.7%p 높다. FWM의 공식 결과(96.75%)와도 거의 동등한 수준이다. 이는 modular encoder의 도입이 체계적 일반화 능력을 추가하면서도, 일반적인 연관 추론 성능에서 기존 최고 수준을 유지함을 보여준다.

### Symbolic Representation 분석

학습된 표현이 올바른 symbolic property를 갖는지 두 가지 분석으로 검증한다.

**Role-Unbinding Orthogonality**: TPR에서 올바른 unbinding을 위해서는 role 벡터와 unbinding 벡터가 orthogonal해야 한다. FWM은 role-unbinding 유사도 행렬에서 off-diagonal 간섭이 나타나지만, 제안 방법은 거의 완벽한 orthogonality를 보인다. 이는 modular encoder가 각 객체에 대해 분리 가능한(separable) symbolic representation을 학습했음을 의미한다.

<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1.5rem 0;">
<div style="text-align: center;">
<img src="/images/iconip2022/diff_ne_FWM.png" alt="FWM role-unbinding" style="max-width: 200px;">
<p class="caption">(a) FWM</p>
</div>
<div style="text-align: center;">
<img src="/images/iconip2022/diff_ne_ours.png" alt="Ours role-unbinding" style="max-width: 200px;">
<p class="caption">(b) Ours</p>
</div>
</div>

<p class="caption">Role 벡터와 unbinding 벡터 간 유사도 행렬. FWM은 orthogonal하지 않지만, 제안 방법은 거의 완벽한 orthogonality를 보인다.</p>

**Filler Consistency**: 동일한 대상 객체에 대해, 어떤 조합에서 질의하든 동일한 read 벡터가 반환되어야 체계적 추론이라 할 수 있다. FWM은 조합에 따라 read 벡터가 달라지지만, 제안 방법은 조합에 관계없이 거의 동일한 read 벡터를 반환한다. 이는 모델이 특정 조합을 암기하는 것이 아니라, 개별 구성 요소를 독립적으로 인코딩하고 재조합하여 추론하고 있음을 보여주는 증거이다.

<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1.5rem 0;">
<div style="text-align: center;">
<img src="/images/iconip2022/diff_vs_FWM.png" alt="FWM read vectors" style="max-width: 200px;">
<p class="caption">(a) FWM</p>
</div>
<div style="text-align: center;">
<img src="/images/iconip2022/diff_vs_ours.png" alt="Ours read vectors" style="max-width: 200px;">
<p class="caption">(b) Ours</p>
</div>
</div>

<p class="caption">동일한 fruit 객체에 대한 read 벡터 간 유사도. 제안 방법은 조합에 관계없이 일관된 출력을 보인다.</p>

---
