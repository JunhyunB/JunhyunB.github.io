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

We overcome IRM's limitation of learning only dominant invariant features by integrating modular neural networks, improving OoD generalization in medical imaging.

1. **Modular encoder** — Split the data representation model into $N$ modules, each learning distinct invariant features.
2. **Competitive selection** — Select the $k$ most relevant modules via multi-head dot product attention.
3. **IRM optimization** — Optimize the IRM objective with weighted representations from selected modules, achieving OoD generalization through diverse invariant features.

![Modular IRM Framework](/images/iceic2024/diagram.webp)

<p class="caption">Overview of the proposed method: modular data representations integrated within the IRM framework.</p>

---

## Method

While IRM aims to learn invariant predictors across environments, in practice it tends to encode only the **most dominant invariant feature**. This problem is particularly pronounced on real medical imaging datasets such as Camelyon17 and CheXpert, where IRM can perform even worse than ERM.

To address this, we split the data representation model $\Phi$ into $N$ independent modules $\{f_n\}_{n=1}^N$. Each module is encouraged to learn different features through **competitive learning** via multi-head dot product attention. The input itself serves as the query, module outputs serve as keys/values, and the top-$k$ modules are selected. To prevent module collapse, non-selected modules' attention scores are set to zero rather than negative infinity, maintaining soft selection.

![Dataset Examples](/images/iceic2024/data.webp)

<p class="caption">Example images from the Camelyon17-wilds and CheXpert datasets across different environments.</p>

---

## Results

### Colored MNIST

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 88.6% | 16.4% | 1,198,337 |
| IRM | 73.4% | 60.5% | 1,198,337 |
| **Ours (N=3, k=1)** | **74.9%** | **66.5%** | 935,553 |
| Optimal | 75.0% | 75.0% | N/A |

Our method (N=3, k=1) improves OoD accuracy by 6.0pp over IRM (66.5% vs 60.5%) while using 22% fewer parameters. The validation accuracy of 74.9%, close to the theoretical optimum (75.0%), indicates that the model has almost entirely learned the invariant feature (digit shape) rather than the spurious feature (color).

### Camelyon17-wilds (OoD Medical Imaging)

| Algorithm | Val Accuracy (iid) | Test Accuracy (OoD) | # Params |
|---|---|---|---|
| ERM | 91.9% | 73.3% | 42.8M |
| IRM | 94.1% | 72.9% | 42.8M |
| **Ours (N=4, k=2)** | 91.5% | **83.5%** | 45.6M |
| Ours (N=2, k=1) | 90.4% | 74.5% | **22.8M** |

Notably, **IRM (72.9%) performs even worse than ERM (73.3%)** on OoD accuracy. This demonstrates that IRM relies solely on the dominant invariant feature while missing the diverse causal features actually needed, empirically validating the core motivation of this paper. Our method (N=4, k=2) achieves a +10.2pp OoD improvement over ERM (83.5% vs 73.3%). Meanwhile, the N=2, k=1 configuration significantly reduces the parameter count (22.8M vs 42.8M) while maintaining baseline-level performance (74.5%).

### CheXpert (Subpopulation Shift)

| Algorithm | Average Accuracy | Worst-case Accuracy |
|---|---|---|
| ERM | 86.9% | 50.2% |
| IRM | 89.8% | 34.4% |
| **Ours (N=3, k=1)** | 80.3% | **59.6%** |

On CheXpert as well, IRM's worst-case accuracy is **15.8pp lower than ERM** (34.4% vs 50.2%). IRM improves average accuracy but severely degrades performance for specific demographic groups. Our method trades some average accuracy for a worst-case accuracy of 59.6%, achieving +9.4pp over ERM and +25.2pp over IRM. This is particularly significant for medical imaging where fair performance across demographic groups is critical.

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

With k=1, performance stays in the 73–75% range regardless of module count, showing limited improvement over baselines. The N=4, k=2 configuration reaches the highest reported accuracy of 83.5%. In contrast, N=3, k=2 gives the lowest result at 57.6%, and N=5, k=2 reaches 75.6%.

---
