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

1. **Modular encoding** — Recurrent Independent Mechanisms(RIMs)를 encoder로 사용한다. 여러 RNN 모듈이 경쟁적으로 활성화되어 입력을 인코딩하면서 재조합 가능한 표현을 학습한다.
2. **TPR binding** — Tensor Product Representation(TPR)으로 role과 filler를 묶어(binding) 연관 관계를 표현한다: $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$
3. **Memory-based recall** — TPR 기반 외부 메모리에 연관 관계를 저장하고, 학습하지 않은 조합에서도 체계적으로 추론한다.

![Modular TPR Architecture](/images/iconip2022/main-figure.webp)

<p class="caption">
전체 아키텍처. 각 시점 $t$마다 modular encoder의 hidden state $h_t$에서 role $r_t$와 filler $f_t$를 각각 추출하고, 두 벡터의 tensor product($\otimes$)를 외부 메모리 $\mathbf{M}_t$에 누적한다. 질의 시에는 같은 encoder가 unbinding 벡터 $u_t$를 만들어 메모리에서 해당 filler를 꺼내고(unbind), 이를 선형 변환해 출력 $o_t$를 얻는다.
</p>

---

## Method

기존 memory augmented neural network (MANN)는 학습 데이터와 체계적으로 다른(systematically different) 테스트 데이터에서 성능이 급락한다. 핵심 원인은 encoder가 학습된 조합에 과적합해, 개별 구성 요소를 재조합 가능한(recomposable) 형태로 표현하지 못한다는 데 있다. 이를 해결하기 위해 **modular RNN encoder와 TPR 기반 외부 메모리**를 결합한다.

**핵심 구성:**
- **Recurrent Independent Mechanisms (RIMs)**: 여러 RNN 모듈이 competitive learning으로 각자 독립적인 인코딩 메커니즘을 학습
- **Tensor Product Representation (TPR)**: role과 filler를 tensor product로 묶어 연관 관계를 표현 — $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$
- **TPR-based External Memory**: 각 시점 $t$에서 hidden state로부터 role/filler 표현을 추출해 메모리에 중첩(superpose)한다. 쓰기 강도 $\beta = \sigma(W_\beta h_t)$를 사용해 $\mathbf{M}_t = \mathbf{M}_{t-1} + \mathbf{r}_t \otimes (\beta \mathbf{f}_t - (1-\beta) \mathbf{f}_{t-1})$로 갱신한다.
- **Systematic Associative Recall (SAR)**: 체계적 일반화 평가를 위한 새 벤치마크 제안

---

## Results

### Systematic Associative Recall (SAR) Task

SAR은 본 논문에서 제안하는 벤치마크로, associative reasoning에서의 체계적 일반화를 측정하기 위해 설계되었다. 세 가지 객체 집합(사람 이름 $S_h$, 과일 이름 $S_f$, 숫자 이름 $S_n$)을 사용하며, 학습 데이터와 테스트 데이터 간에 **객체 조합을 체계적으로 다르게** 구성한다.

구체적으로, $S_h$의 일부($S_h^1$)는 학습 시 숫자와만 연관되고, 다른 일부($S_h^2$)는 과일과만 연관된다. 테스트는 두 가지다. 학습과 같은 관계를 묻는 <strong>test (same)</strong>과, 관계를 뒤바꿔 $S_h^1$은 과일과, $S_h^2$는 숫자와 연관시킨 <strong>test (different)</strong>이다. 난이도 파라미터 $p = |S_h^3| / |S_h|$는 학습 시 과일·숫자 모두와 연관되는 사람 이름($S_h^3$)의 비율로, 값이 작을수록 학습/테스트 간 체계적 차이가 크다.

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

<p class="caption">SAR 태스크에서 DNC, FWM, 제안 방법의 학습/테스트 정확도 비교(15k iteration).</p>

DNC와 FWM은 모든 $p$에서 test (same)과 test (different) 사이에 큰 격차를 보인다. 학습 때 본 조합에는 맞추지만, 관계가 뒤바뀐 조합으로는 일반화하지 못한다는 뜻이다. 제안 방법은 $p=0.3$과 $p=0.5$에서 test (different) 정확도가 90%를 넘어 격차를 크게 좁힌다. 다만 가장 어려운 $p=0.1$에서는 제안 방법도 test (different) 정확도가 40%에 못 미쳐, 여전히 큰 격차가 남는다. FWM이 TPR 기반 메모리를 사용함에도 불구하고 체계적 일반화에 실패한다는 것은, TPR 메모리만으로는 충분하지 않으며 **encoder가 올바른 symbolic representation을 학습하는 것**이 핵심임을 시사한다.

### Concatenated-bAbI (catbAbI)

SAR이 체계적 일반화에 초점을 맞춘 반면, catbAbI는 일반적인 장기 연관 추론 성능을 평가한다. bAbI의 story를 끝없이 이어 붙인 sequence에서 질의응답을 수행하는 태스크이다.

<p class="caption">catbAbI test accuracy (3회 평균). our trial은 동일 세팅에서 직접 재현한 결과다.</p>

| Model | Test Accuracy |
|---|---|
| LSTM | 80.88% |
| Transformer-XL | 87.66% |
| Meta-learned Neural Memory | 88.97% |
| Fast Weight Memory (FWM) | **96.75%** |
| FWM (our trial) | 94.94% |
| **Ours** | **96.63%** |

동일한 실험 세팅(our trial)에서 비교하면, 제안 방법(96.63%)이 FWM(94.94%)보다 1.7%p 높고, FWM 논문의 보고치(96.75%)와도 거의 같다. modular encoder를 도입해 체계적 일반화 능력을 더하면서도, 일반적인 연관 추론 성능은 최고 수준에 가깝게 유지함을 보여준다.

### Symbolic Representation 분석

학습된 표현이 올바른 symbolic property를 갖는지 두 가지 분석으로 검증한다.

**Role-Unbinding Orthogonality**: TPR에서 filler를 올바르게 꺼내려면(unbinding), 같은 객체의 role 벡터와 unbinding 벡터는 유사도가 1에 가깝고, 서로 다른 객체끼리는 0에 가까워야(직교) 한다. FWM은 유사도 행렬의 off-diagonal 값이 상당히 남아 있지만, 제안 방법은 훨씬 직교에 가깝다. 이는 modular encoder가 각 객체에 대해 분리 가능한(separable) symbolic representation을 학습했음을 의미한다.

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

<p class="caption">서로 다른 사람 객체에 대한 role 벡터와 unbinding 벡터 간 유사도 행렬. FWM은 off-diagonal 유사도가 남아 있지만, 제안 방법은 거의 직교한다.</p>

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

<p class="caption">같은 과일 객체를 꺼낸 read 벡터 간 유사도. 제안 방법은 조합에 관계없이 일관된 출력을 보인다.</p>

---
