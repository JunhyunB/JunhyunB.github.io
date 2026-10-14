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

We propose a novel architecture combining a modular encoder with TPR-based external memory to achieve systematic generalization in associative reasoning, where conventional MANNs fail on systematically different test data.

1. **Modular encoding** — The encoder is built from Recurrent Independent Mechanisms (RIMs): multiple RNN modules compete for activation to encode the input, learning recomposable representations.
2. **TPR binding** — A Tensor Product Representation (TPR) binds each filler to its role via the tensor product: $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$
3. **Memory-based recall** — Associations are stored in TPR-based external memory, enabling systematic reasoning over unseen combinations.

![Modular TPR Architecture](/images/iconip2022/main-figure.webp)

<p class="caption">
Overall architecture. At each time step $t$, a role $r_t$ and a filler $f_t$ are extracted from the modular encoder's hidden state $h_t$, and their tensor product ($\otimes$) is accumulated into the external memory $\mathbf{M}_t$. At query time, the same encoder produces an unbinding vector $u_t$ that retrieves the target filler from memory, which is then linearly projected to the read output $o_t$.
</p>

---

## Method

Conventional memory augmented neural networks (MANNs) suffer from severe performance degradation on systematically different test data. The core issue is that the encoder overfits to training combinations, failing to represent individual components in a recomposable form. We address this by combining a **modular RNN encoder with TPR-based external memory**.

**Key components:**
- **Recurrent Independent Mechanisms (RIMs)**: Multiple RNN modules learn independent encoding mechanisms via competitive learning
- **Tensor Product Representation (TPR)**: Roles and fillers are bound via tensor products to represent their associations — $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$
- **TPR-based External Memory**: Role/filler representations are extracted at each time step and superposed into memory using a learned write strength $\beta = \sigma(W_\beta h_t)$: $\mathbf{M}_t = \mathbf{M}_{t-1} + \mathbf{r}_t \otimes (\beta \mathbf{f}_t - (1-\beta) \mathbf{f}_{t-1})$.
- **Systematic Associative Recall (SAR)**: A new benchmark proposed for evaluating systematic generalization in associative reasoning

---

## Results

### Systematic Associative Recall (SAR) Task

SAR is a benchmark proposed in this paper, designed to measure systematic generalization in associative reasoning. It uses three object sets (human names $S_h$, fruit names $S_f$, number names $S_n$) and constructs **systematically different object combinations** between training and test data.

Specifically, a subset $S_h^1$ is associated only with numbers during training, while another subset $S_h^2$ is associated only with fruits. Two test splits are used: **test (same)** keeps these training relations, while **test (different)** swaps them, pairing $S_h^1$ with fruits and $S_h^2$ with numbers. The difficulty parameter $p = |S_h^3| / |S_h|$ is the fraction of human names ($S_h^3$) associated with both fruits and numbers during training; smaller values mean a larger systematic gap between training and test.

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

<p class="caption">Training/test accuracy comparison of DNC, FWM, and our proposed method on the SAR task over 15k iterations.</p>

DNC and FWM show large gaps between test (same) and test (different) at every $p$: they fit the combinations seen during training but fail to generalize once the relations are swapped. Our method substantially narrows the gap at $p=0.3$ and $p=0.5$, where test (different) accuracy exceeds 90%. At the hardest setting ($p=0.1$), however, its test (different) accuracy also stays below 40%, leaving a large gap. The fact that FWM fails at systematic generalization despite using TPR-based memory suggests that TPR memory alone is insufficient — **learning proper symbolic representations in the encoder** is the key factor.

### Concatenated-bAbI (catbAbI)

While SAR focuses on systematic generalization, catbAbI evaluates general long-range associative reasoning: question answering over an infinite stream of concatenated bAbI stories.

<p class="caption">catbAbI test accuracy (average of 3 runs). "Our trial" denotes our reproduction under the same setup.</p>

| Model | Test Accuracy |
|---|---|
| LSTM | 80.88% |
| Transformer-XL | 87.66% |
| Meta-learned Neural Memory | 88.97% |
| Fast Weight Memory (FWM) | **96.75%** |
| FWM (our trial) | 94.94% |
| **Ours** | **96.63%** |

Under the same experimental setup (our trial), our method (96.63%) outperforms FWM (94.94%) by 1.7 percentage points and nearly matches FWM's reported result (96.75%). This shows that adding the modular encoder brings systematic generalization without sacrificing performance on general associative reasoning.

### Symbolic Representation Analysis

We verify through two analyses whether the learned representations possess proper symbolic properties.

**Role-Unbinding Orthogonality**: For correct TPR unbinding, the role and unbinding vectors of the same object should have similarity close to 1, while those of different objects should be close to 0 (orthogonal). FWM retains substantial off-diagonal similarity, whereas our method is much closer to orthogonal. This indicates that the modular encoder learns separable symbolic representations for each object.

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

<p class="caption">Similarity matrices between role vectors and unbinding vectors for different human objects. FWM retains noticeable off-diagonal similarity, while our method is nearly orthogonal.</p>

**Filler Consistency**: For systematic reasoning, querying the same target object should return the same read vector regardless of the combination context. FWM produces different read vectors depending on the combination, while our method returns nearly identical read vectors regardless of context. This provides evidence that the model encodes individual components independently and recombines them for reasoning, rather than memorizing specific combinations.

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

<p class="caption">Similarity between read vectors for the same fruit object. Our method produces consistent outputs regardless of the combination.</p>

---
