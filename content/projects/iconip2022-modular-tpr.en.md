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

{{< video src="/videos/iconip2022-modular-tpr.mp4" poster="/videos/iconip2022-modular-tpr.jpg" caption="Systematic associative recall through modular RNNs and orthogonal Tensor Product Representations" >}}

## Abstract

Learning associative reasoning is necessary to implement human-level artificial intelligence even when a model faces unfamiliar associations of learned components. However, conventional memory augmented neural networks (MANNs) have shown degraded performance on systematically different data since they lack consideration of systematic generalization. In this work, we propose a novel architecture for MANNs which explicitly aims to learn recomposable representations with a modular structure of RNNs. Our method binds learned representations with a Tensor Product Representation (TPR) to manifest their associations and stores the associations into TPR-based external memory. In addition, to demonstrate the effectiveness of our approach, we introduce a new benchmark for evaluating systematic generalization performance on associative reasoning, which contains systematically different combinations of words between training and test data. From the experimental results, our method shows superior test accuracy on systematically different data compared to other models. Furthermore, we validate the models using TPR by analyzing whether the learned representations have symbolic properties.

---

## Overview

Systematic Associative Recall (SAR), which we introduce here, changes the associations between training and test data. Human names associated only with numbers during training are paired with fruits at test time. The words are familiar, but their combinations are different.

DNC and FWM achieve high accuracy on familiar combinations but lose accuracy when those combinations change. Our model combines a modular RNN encoder with TPR-based memory to reduce this gap. Since FWM also uses TPR memory, we also compare the encoders' role and filler representations directly; our modular encoder produces far more consistent representations when retrieving the same object across swapped combinations.

![Modular TPR Architecture](/images/iconip2022/main-figure.webp)

<p class="caption">
Overall architecture. At each time step $t$, a role $r_t$ and a filler $f_t$ are extracted from the modular encoder's hidden state $h_t$, and their tensor product ($\otimes$) is accumulated into the external memory $\mathbf{M}_t$. At query time, the same encoder produces an unbinding vector $u_t$ that retrieves the target filler from memory, which is then linearly projected to the read output $o_t$.
</p>

---

## Method

Being able to store associations in external memory does not guarantee handling novel combinations. A monolithic RNN folds every token into a single hidden state, making its representations easy to entangle with training pairings. We therefore pair a **modular RNN encoder with TPR-based external memory** so that components stay separable and recomposable.

For the encoder, we use **Recurrent Independent Mechanisms (RIMs)**. Multiple independent RNN modules compete for each input via attention, and only the relevant subset activates and updates its state at each step — keeping distinct objects and roles from collapsing into one shared state.

For external memory, we use a **Tensor Product Representation (TPR)**, which binds each role vector $\mathbf{r}_k$ with its filler $\mathbf{f}_k$ via outer product and superposes all bindings into one matrix $T = \sum_{k=1}^N \mathbf{r}_k \otimes \mathbf{f}_k$. At each step $t$, the modular encoder extracts $(\mathbf{r}_t, \mathbf{f}_t, \mathbf{u}_t)$ and a learned write strength $\beta = \sigma(W_\beta h_t)$ to update memory; at query time, multiplying by the unbinding vector $\mathbf{u}_t$ retrieves the target filler.

$$\mathbf{M}_t = \mathbf{M}_{t-1} + \textcolor{#B84327}{\mathbf{r}_t} \otimes \bigl(\beta\,\textcolor{#2A6F4E}{\mathbf{f}_t} - (1-\beta)\,\mathbf{f}_{t-1}\bigr)$$

---

## Results

### Systematic Associative Recall (SAR) Task

SAR is a benchmark we designed to measure systematic generalization in associative reasoning. It uses three object sets (human names $S_h$, fruit names $S_f$, number names $S_n$) and constructs **systematically different object combinations** between training and test data.

Specifically, a subset $S_h^1$ is associated only with numbers during training, while another subset $S_h^2$ is associated only with fruits. Two test splits are used: **test (same)** keeps these training relations, while **test (different)** swaps them, pairing $S_h^1$ with fruits and $S_h^2$ with numbers. The difficulty parameter $p = |S_h^3| / |S_h|$ is the fraction of human names ($S_h^3$) associated with both fruits and numbers during training; smaller values mean a larger systematic gap between training and test.

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

<p class="caption">Training/test accuracy comparison of DNC, FWM, and our proposed method on the SAR task over 15k iterations.</p>

DNC and FWM show large gaps between test (same) and test (different) at every $p$: they fit the combinations seen during training but fail to generalize once the relations are swapped. Our method substantially narrows the gap at $p=0.3$ and $p=0.5$, where test (different) accuracy exceeds 90%. At the hardest setting ($p=0.1$), however, its test (different) accuracy also stays below 40%, leaving a large gap. The fact that FWM fails at systematic generalization despite using TPR-based memory suggests that TPR memory alone is insufficient — **learning proper symbolic representations in the encoder** is the key factor.

### Concatenated-bAbI (catbAbI)

While SAR focuses on systematic generalization, catbAbI evaluates general long-range associative reasoning: question answering over an infinite stream of concatenated bAbI stories.

<p class="caption">catbAbI test accuracy (average of 3 runs). "Our trial" denotes our reproduction under the same setup; bold marks the highest reported score and the highest score under our reproduced setup.</p>

| Model | Test Accuracy |
|---|---|
| LSTM | 80.88% |
| Transformer-XL | 87.66% |
| Meta-learned Neural Memory | 88.97% |
| Fast Weight Memory (FWM) | **96.75%** |
| FWM (our trial) | 94.94% |
| **Ours** | **96.63%** |

Under the same experimental setup (our trial), our method (96.63%) outperforms FWM (94.94%) by 1.7 percentage points and nearly matches FWM's reported result (96.75%). Adding the modular encoder brings systematic generalization without sacrificing performance on general associative reasoning.

### Symbolic Representation Analysis

We verify through two analyses whether the learned representations possess proper symbolic properties.

**Role-Unbinding Orthogonality.** For correct TPR unbinding, the role and unbinding vectors of the same object should have similarity close to 1, while those of different objects should be close to 0 (orthogonal).

$$\textcolor{#634294}{\mathbf{u}_2} \cdot T = (\textcolor{#634294}{\mathbf{u}_2} \cdot \textcolor{#B84327}{\mathbf{r}_1})\textcolor{#A86A14}{\mathbf{f}_1} + (\textcolor{#634294}{\mathbf{u}_2} \cdot \textcolor{#634294}{\mathbf{r}_2})\textcolor{#2A6F4E}{\mathbf{f}_2}$$

{{< tpr-ortho-widget >}}

FWM retains substantial off-diagonal similarity, whereas our method is much closer to orthogonal — indicating that the modular encoder learns separable symbolic representations for each object.

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

<p class="caption">Similarity matrices between role vectors and unbinding vectors for different human objects. FWM retains noticeable off-diagonal similarity, while our method is nearly orthogonal.</p>

**Filler Consistency.** For systematic reasoning, querying the same target object should return the same read vector regardless of the combination context. FWM produces different read vectors depending on the combination, while our method returns nearly identical read vectors across contexts — showing that the model encodes and recombines individual components rather than memorizing specific pairs.

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

<p class="caption">Similarity between read vectors for the same fruit object. Our method produces consistent outputs regardless of the combination.</p>

---
