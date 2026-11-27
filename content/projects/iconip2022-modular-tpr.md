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
  image: "/videos/iconip2022-modular-tpr.jpg"
  alt: "Modular TPR Role Orthogonality"
  hidden: true
---

{{< paper-header
  venue="ICONIP 2022"
  authors="<strong>Jun-Hyun Bae</strong>*, Taewon Park*, Minho Lee"
  affil="Kyungpook National University"
  note="* Equal Contribution"
  paper="https://link.springer.com/chapter/10.1007/978-3-031-30108-7_10"
>}}

{{< video src="/videos/iconip2022-modular-tpr.mp4" poster="/videos/iconip2022-modular-tpr.jpg" caption="모듈형 RNN과 텐서곱 표현(TPR)의 직교 결합으로 체계적 연상 추론을 일반화하는 구조" >}}

## Abstract

Learning associative reasoning is necessary to implement human-level artificial intelligence even when a model faces unfamiliar associations of learned components. However, conventional memory augmented neural networks (MANNs) have shown degraded performance on systematically different data since they lack consideration of systematic generalization. In this work, we propose a novel architecture for MANNs which explicitly aims to learn recomposable representations with a modular structure of RNNs. Our method binds learned representations with a Tensor Product Representation (TPR) to manifest their associations and stores the associations into TPR-based external memory. In addition, to demonstrate the effectiveness of our approach, we introduce a new benchmark for evaluating systematic generalization performance on associative reasoning, which contains systematically different combinations of words between training and test data. From the experimental results, our method shows superior test accuracy on systematically different data compared to other models. Furthermore, we validate the models using TPR by analyzing whether the learned representations have symbolic properties.

---

## Overview

여기서 제안하는 Systematic Associative Recall(SAR)은 학습과 테스트의 연관 관계를 다르게 구성한다. 학습 중 숫자와만 연결된 사람 이름을 테스트에서는 과일과 연결한다. 등장하는 단어는 이미 학습했지만 조합은 달라지는 설정이다.

DNC와 FWM은 학습과 같은 조합에서는 정확도가 높았지만, 조합을 바꾸면 성능이 크게 떨어졌다. 제안 모델은 modular RNN encoder와 TPR 기반 메모리를 결합해 이 격차를 줄였다. FWM도 TPR 메모리를 사용하므로, 두 모델의 비교에서는 encoder가 만드는 role·filler 표현을 함께 분석했다. 제안 모델은 같은 객체를 다른 조합에서 꺼낼 때 더 일관된 표현을 보였다.

![Modular TPR Architecture](/images/iconip2022/main-figure.webp)

<p class="caption">
전체 아키텍처. 각 시점 $t$마다 modular encoder의 hidden state $h_t$에서 role $r_t$와 filler $f_t$를 각각 추출하고, 두 벡터의 tensor product($\otimes$)를 외부 메모리 $\mathbf{M}_t$에 누적한다. 질의 시에는 같은 encoder가 unbinding 벡터 $u_t$를 만들어 메모리에서 해당 filler를 꺼내고(unbind), 이를 선형 변환해 출력 $o_t$를 얻는다.
</p>

---

## Method

메모리에 관계를 저장할 수 있다고 해서 새로운 조합도 잘 다루는 것은 아니다. 단일 RNN 인코더는 모든 입력을 하나의 hidden state로 묶기 때문에, 학습에서 본 조합에 얽힌(entangled) 표현을 만들기 쉽다. 여기서는 **modular RNN encoder와 TPR 기반 외부 메모리**를 결합해, 구성 요소를 다시 조합하기 좋은 표현을 배우도록 유도한다.

인코더로는 **Recurrent Independent Mechanisms(RIMs)**를 사용한다. 여러 독립된 RNN 모듈이 입력에 따라 경쟁(competitive learning)하며, 각 시점에 관련 있는 일부 모듈만 활성화되어 상태를 갱신한다. 덕분에 서로 다른 객체나 역할이 하나의 상태에 뒤섞이지 않고 독립적인 메커니즘으로 분리된다.

외부 메모리는 **Tensor Product Representation(TPR)**에 기반한다. 역할 벡터 $\mathbf{r}_k$와 값(filler) 벡터 $\mathbf{f}_k$를 외적(outer product)으로 결합해 하나의 행렬 $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$에 중첩(superpose)한다. 매 시점 $t$마다 modular encoder의 hidden state $h_t$에서 $(\mathbf{r}_t, \mathbf{f}_t, \mathbf{u}_t)$와 쓰기 강도 $\beta = \sigma(W_\beta h_t)$를 추출해 메모리를 갱신하고, 질의 시에는 unbinding 벡터 $\mathbf{u}_t$를 곱해 원하는 filler를 복원한다.

$$\mathbf{M}_t = \mathbf{M}_{t-1} + \textcolor{#B84327}{\mathbf{r}_t} \otimes \bigl(\beta\,\textcolor{#2A6F4E}{\mathbf{f}_t} - (1-\beta)\,\mathbf{f}_{t-1}\bigr)$$

---

## Results

### Systematic Associative Recall (SAR) Task

SAR은 associative reasoning에서의 체계적 일반화를 측정하기 위해 설계한 벤치마크다. 세 가지 객체 집합(사람 이름 $S_h$, 과일 이름 $S_f$, 숫자 이름 $S_n$)을 사용하며, 학습 데이터와 테스트 데이터 간에 **객체 조합을 체계적으로 다르게** 구성한다.

구체적으로, $S_h$의 일부($S_h^1$)는 학습 시 숫자와만 연관되고, 다른 일부($S_h^2$)는 과일과만 연관된다. 테스트는 두 가지다. 학습과 같은 관계를 묻는 <strong>test (same)</strong>과, 관계를 뒤바꿔 $S_h^1$은 과일과, $S_h^2$는 숫자와 연관시킨 <strong>test (different)</strong>이다. 난이도 파라미터 $p = |S_h^3| / |S_h|$는 학습 시 과일·숫자 모두와 연관되는 사람 이름($S_h^3$)의 비율로, 값이 작을수록 학습/테스트 간 체계적 차이가 크다.

<div class="figure-row">
<figure>
<img src="/images/iconip2022/dnc.webp" alt="DNC accuracy on SAR">
<figcaption>(a) DNC</figcaption>
</figure>
<figure>
<img src="/images/iconip2022/fwm.webp" alt="FWM accuracy on SAR">
<figcaption>(b) FWM</figcaption>
</figure>
<figure>
<img src="/images/iconip2022/ours.webp" alt="Ours accuracy on SAR">
<figcaption>(c) Ours</figcaption>
</figure>
</div>

<p class="caption">SAR 태스크에서 DNC, FWM, 제안 방법의 학습/테스트 정확도 비교(15k iteration).</p>

DNC와 FWM은 모든 $p$에서 test (same)과 test (different) 사이에 큰 격차를 보인다. 학습 때 본 조합에는 맞추지만, 관계가 뒤바뀐 조합으로는 일반화하지 못한다는 뜻이다. 제안 방법은 $p=0.3$과 $p=0.5$에서 test (different) 정확도가 90%를 넘어 격차를 크게 좁힌다. 다만 가장 어려운 $p=0.1$에서는 제안 방법도 test (different) 정확도가 40%에 못 미쳐, 여전히 큰 격차가 남는다. FWM이 TPR 기반 메모리를 사용함에도 불구하고 체계적 일반화에 실패한다는 것은, TPR 메모리만으로는 충분하지 않으며 **encoder가 올바른 symbolic representation을 학습하는 것**이 핵심임을 시사한다.

### Concatenated-bAbI (catbAbI)

SAR이 체계적 일반화에 초점을 맞춘 반면, catbAbI는 일반적인 장기 연관 추론 성능을 평가한다. bAbI의 story를 끝없이 이어 붙인 sequence에서 질의응답을 수행하는 태스크다.

<p class="caption">catbAbI test accuracy (3회 평균). our trial은 동일 세팅에서 직접 재현한 결과이며, 굵은 글씨는 보고치 기준과 직접 재현 기준 각각의 최고값이다.</p>

| Model | Test Accuracy |
|---|---|
| LSTM | 80.88% |
| Transformer-XL | 87.66% |
| Meta-learned Neural Memory | 88.97% |
| Fast Weight Memory (FWM) | **96.75%** |
| FWM (our trial) | 94.94% |
| **Ours** | **96.63%** |

동일한 실험 세팅(our trial)에서 비교하면, 제안 방법(96.63%)이 FWM(94.94%)보다 1.7%p 높고, FWM 논문의 보고치(96.75%)와도 거의 같다. modular encoder를 도입해 체계적 일반화 능력을 더하면서도, 일반적인 연관 추론 성능은 최고 수준에 가깝게 유지한다.

### Symbolic Representation 분석

학습된 표현이 올바른 symbolic property를 갖는지 두 가지 분석으로 검증한다.

**Role-Unbinding Orthogonality.** TPR에서 filler를 올바르게 꺼내려면(unbinding), 같은 객체의 role 벡터와 unbinding 벡터는 유사도가 1에 가깝고, 서로 다른 객체끼리는 0에 가까워야(직교) 한다.

$$\textcolor{#634294}{\mathbf{u}_2} \cdot T = (\textcolor{#634294}{\mathbf{u}_2} \cdot \textcolor{#B84327}{\mathbf{r}_1})\textcolor{#A86A14}{\mathbf{f}_1} + (\textcolor{#634294}{\mathbf{u}_2} \cdot \textcolor{#634294}{\mathbf{r}_2})\textcolor{#2A6F4E}{\mathbf{f}_2}$$

{{< tpr-ortho-widget >}}

FWM은 유사도 행렬의 off-diagonal 값이 상당히 남아 있지만, 제안 방법은 훨씬 직교에 가깝다. modular encoder가 각 객체에 대해 분리 가능한(separable) symbolic representation을 학습했음을 뜻한다.

<div class="figure-row figure-row--grid">
<figure>
<img src="/images/iconip2022/diff_ne_FWM.png" alt="FWM role-unbinding" style="max-width: 210px;">
<figcaption>(a) FWM</figcaption>
</figure>
<figure>
<img src="/images/iconip2022/diff_ne_ours.png" alt="Ours role-unbinding" style="max-width: 210px;">
<figcaption>(b) Ours</figcaption>
</figure>
</div>

<p class="caption">서로 다른 사람 객체에 대한 role 벡터와 unbinding 벡터 간 유사도 행렬. FWM은 off-diagonal 유사도가 남아 있지만, 제안 방법은 거의 직교한다.</p>

**Filler Consistency.** 동일한 대상 객체에 대해, 어떤 조합에서 질의하든 동일한 read 벡터가 반환되어야 체계적 추론이라 할 수 있다. FWM은 조합에 따라 read 벡터가 달라지지만, 제안 방법은 조합에 관계없이 거의 동일한 read 벡터를 반환한다. 특정 조합을 암기하는 대신 개별 구성 요소를 독립적으로 인코딩하고 재조합해 추론하고 있음을 보여준다.

<div class="figure-row figure-row--grid">
<figure>
<img src="/images/iconip2022/diff_vs_FWM.png" alt="FWM read vectors" style="max-width: 210px;">
<figcaption>(a) FWM</figcaption>
</figure>
<figure>
<img src="/images/iconip2022/diff_vs_ours.png" alt="Ours read vectors" style="max-width: 210px;">
<figcaption>(b) Ours</figcaption>
</figure>
</div>

<p class="caption">같은 과일 객체를 꺼낸 read 벡터 간 유사도. 제안 방법은 조합에 관계없이 일관된 출력을 보인다.</p>

---
