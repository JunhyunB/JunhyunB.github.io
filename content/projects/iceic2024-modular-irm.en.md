---
title: "Invariant Risk Minimization in Medical Imaging with Modular Data Representation"
date: 2024-01-01
draft: false
tags: ["invariant-risk-minimization", "out-of-distribution", "medical-imaging"]
summary: "ICEIC 2024 — Jun-Hyun Bae, Chanwoo Kim, Taeyoung Chang"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/iceic2024/diagram.webp"
  alt: "Modular IRM diagram"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">ICEIC 2024</span><br>
<span style="color: var(--secondary);"><strong>Jun-Hyun Bae</strong><sup>1</sup>, Chanwoo Kim<sup>2</sup>, Taeyoung Chang<sup>2</sup><br>
<sup>1</sup>Kyungpook National University · <sup>2</sup>Seoul National University</span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://ieeexplore.ieee.org/document/10457174/" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Paper</a>
</div>

## Abstract

Despite the effectiveness of deep neural networks trained with Empirical Risk Minimization (ERM) in medical imaging tasks, these models often exhibit performance degradation when faced with Out-of-Distribution (OoD) data, owing to potential biases in their predictive accuracy. Invariant Risk Minimization (IRM) seeks to rectify this issue by identifying invariant or causal correlations across various environments. However, its practical application does not consistently deliver the expected generalization performance in real-world scenarios. This paper addresses a potential limitation of the IRM framework, positing that the constraints enforced by IRM might not sufficiently guide the model in learning all causal features. In response, we propose a novel methodology leveraging modular neural networks within the IRM framework. Our approach aims to generate more diverse data representations, thereby enhancing the generalization performance of models trained with IRM. Experimental validation on three tasks — two medical image classification tasks, namely, Camelyon17-wilds and CheXpert, and a synthetic task, Colored MNIST — demonstrates significant improvements in generalization performance in both OoD settings and subpopulation shift cases.

---

## Overview

We address a potential limitation of IRM (that it may learn only the most dominant invariant features) by integrating modular neural networks, improving generalization under OoD and subpopulation shift in medical imaging.

1. **Modular encoder** — Split the data representation model into $N$ modules, encouraging each to learn a distinct subset of invariant features.
2. **Competitive selection** — Select the $k$ most relevant modules via multi-head dot product attention.
3. **IRM optimization** — Form the final representation $\Phi(x)$ as a weighted sum of module outputs using the competition-adjusted attention scores, and train it with the IRM objective.

![Modular IRM Framework](/images/iceic2024/diagram.webp)

<p class="caption">Overview of the proposed method: modular data representations integrated within the IRM framework.</p>

---

## Method

While IRM aims to learn invariant predictors across environments, it places no constraint on the representation model itself and relies on the ERM term to shape it, so it may end up encoding only the **most dominant invariant features**. Indeed, on medical imaging datasets such as Camelyon17-wilds and CheXpert, IRM can even underperform ERM.

To address this, we split the data representation model $\Phi$ into $N$ independent modules $\{f_n\}_{n=1}^N$. Each module is encouraged to learn different features through **competitive learning** via multi-head dot product attention. The input itself serves as the query, module outputs serve as keys/values, and the top-$k$ modules are selected. To mitigate module collapse (where only a few modules keep getting selected), the $QK^T$ values of non-selected modules are set to zero rather than negative infinity, so these modules still receive a non-zero weight after the softmax (soft selection).

![Dataset Examples](/images/iceic2024/data.webp)

<p class="caption">Example images from the Camelyon17-wilds and CheXpert datasets across different environments.</p>

---

## Results

### Colored MNIST

In the two training environments, digit color agrees with the label 90% and 80% of the time, while digit shape agrees only 75% of the time. In the test environment the color–label relation is reversed (10%), so a color-reliant model fails badly, whereas an ideal shape-only model stays at 75% in both training and test (Optimal in the table).

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 88.6% | 16.4% | 1,198,337 |
| IRM | 73.4% | 60.5% | 1,198,337 |
| **Ours (N=3, k=1)** | **74.9%** | **66.5%** | 935,553 |
| Optimal | 75.0% | 75.0% | N/A |

Our method (N=3, k=1) improves OoD accuracy by 6.0pp over IRM (66.5% vs 60.5%) while using 22% fewer parameters. Its validation accuracy (74.9%) is close to that of an ideal shape-only predictor (75.0%), and its OoD accuracy is the highest of the three methods, indicating the weakest reliance on the spurious color feature, though still short of the ideal predictor's 75.0%.

### Camelyon17-wilds (OoD Medical Imaging)

Camelyon17-wilds asks whether lymph-node tissue patches contain tumor. Models are trained on data from hospitals 1–3, validated on hospital 4, and tested on hospital 5, which is unseen during training. ERM and IRM use ResNet-101, while our method uses ResNet-18 modules.

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 91.9% | 73.3% | 42.8M |
| IRM | 94.1% | 72.9% | 42.8M |
| **Ours (N=4, k=2)** | 91.5% | **83.5%** | 45.6M |
| Ours (N=2, k=1) | 90.4% | 74.5% | **22.8M** |

Notably, **IRM (72.9%) performs even worse than ERM (73.3%)** on OoD accuracy. This is consistent with the paper's premise that IRM's constraints alone may not ensure that diverse invariant features are learned. Our method (N=4, k=2) achieves a +10.2pp OoD improvement over ERM (83.5% vs 73.3%). Meanwhile, the N=2, k=1 configuration slightly outperforms both baselines (74.5%) with roughly half the parameters (22.8M vs 42.8M).

### CheXpert (Subpopulation Shift)

CheXpert classifies chest X-rays as "No Finding" or not, with environments defined by combinations of race (White, Black, Other) and gender. The goal here is not OoD generalization but raising the lowest accuracy across environments (worst-case accuracy). ERM and IRM use ResNet-50, while our method uses ResNet-18 modules.

| Algorithm | Average Accuracy | Worst-case Accuracy |
|---|---|---|
| ERM | 86.9% | 50.2% |
| IRM | 89.8% | 34.4% |
| **Ours (N=3, k=1)** | 80.3% | **59.6%** |

On CheXpert as well, IRM's worst-case accuracy is **15.8pp lower than ERM** (34.4% vs 50.2%). IRM attains higher average accuracy but much lower accuracy on the worst-off demographic group. Our method gives up average accuracy (80.3% vs. 86.9% for ERM and 89.8% for IRM) in exchange for a worst-case accuracy of 59.6%, +9.4pp over ERM and +25.2pp over IRM. This matters in medical imaging, where consistent performance across demographic groups is critical.

### Module & Winner Count Ablation (Camelyon17)

<p class="caption">OoD test accuracy (%) by module count (N) and winner count (k).</p>

| N (Modules) | k (Winners) | Test Accuracy (OoD) |
|:---:|:---:|:---:|
| 2 | 1 | 74.5 |
| 3 | 1 | 73.1 |
| 3 | 2 | 57.6 |
| 4 | 1 | 73.4 |
| **4** | **2** | **83.5** |
| 5 | 1 | 74.6 |
| 5 | 2 | 75.6 |

With k=1, performance stays in the 73–75% range regardless of module count, showing limited improvement over baselines. The N=4, k=2 configuration is the best at 83.5%, but k=2 is sensitive to N: N=3 drops to 57.6% (the lowest) and N=5 reaches only 75.6%.

---
