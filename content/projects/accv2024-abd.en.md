---
title: "Adaptive Bias Discovery for Learning Debiased Classifier"
date: 2024-12-01
draft: false
tags: ["debiasing", "spurious-correlations", "out-of-distribution"]
summary: "ACCV 2024 — Jun-Hyun Bae, Minho Lee, Heechul Jung"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/accv2024/method.webp"
  alt: "ABD Framework"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">ACCV 2024</span><br>
<span style="color: var(--secondary);"><strong>Jun-Hyun Bae</strong>, Minho Lee, Heechul Jung<br>
Kyungpook National University</span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://openaccess.thecvf.com/content/ACCV2024/html/Bae_Adaptive_Bias_Discovery_for_Learning_Debiased_Classifier_ACCV_2024_paper.html" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Paper</a>
</div>

## Abstract

Training deep neural networks with empirical risk minimization (ERM) often captures dataset biases, hindering generalization to new or unseen data. Previous solutions either require prior knowledge of biases or utilize training intentionally biased models as auxiliaries; however, they still suffer from multiple biases. To address this, we introduce Adaptive Bias Discovery (ABD), a novel learning framework designed to mitigate the impact of multiple unknown biases. ABD trains an auxiliary model to be adapted to biases based on the debiased parameters from the debiasing phase, allowing it to navigate through multiple biases. Then, samples are reweighted based on the discovered biases to update debiased parameters. Extensive evaluations of synthetic experiments and real-world datasets demonstrate that ABD consistently outperforms existing methods, particularly in real-world applications where multiple unknown biases are prevalent.

---

## Overview

We propose a learning framework that sequentially discovers and removes multiple biases in data without any prior bias information.

1. **Bias-adapted model** — Obtain a bias-sensitive auxiliary model $f_\phi$ by taking one (or a few) gradient descent steps from the debiased parameters $\theta$.
2. **Adaptive group formation** — Partition data into a bias-aligned group ($G^\odot$) and a bias-conflicting group ($G^\otimes$) based on $f_\phi$'s predictions.
3. **Iterative debiasing** — Minimize worst-case group loss via group DRO; as $\theta$ becomes robust to one bias, $\phi$ naturally discovers the next.

![ABD Framework](/images/accv2024/method.webp)

<p class="caption">
Overview of the ABD framework, illustrated with two biases (Bias1, Bias2) and two learning steps. Bias1 is a simpler feature that neural networks learn more readily than Bias2; initializing the auxiliary model from the debiased parameters lets it focus on biases not yet discovered.
</p>

---

## Method

Models trained with ERM readily capture spurious correlations in the data, degrading generalization. Existing debiasing methods either require prior knowledge of biases (Group DRO) or rely on a separately trained biased model that tends to capture only the most dominant bias, which limits them when multiple biases coexist (PI, JTT).

ABD alternates between two stages: bias discovery and bias mitigation. First, bias-adapted parameters $\phi = \theta - \alpha \nabla_\theta \mathcal{L}(f_\theta)$ are obtained by gradient descent from the debiased parameters $\theta$ (a single step is shown; multiple steps can be used, and three were used on Colored MNIST). Because neural networks tend to learn easy, superficial features first, the resulting $f_\phi$ is sensitive to superficial patterns in the data, i.e., biases. The samples it predicts correctly form the bias-aligned group ($G^\odot$), and those it gets wrong form the bias-conflicting group ($G^\otimes$).

Next, $\theta$ is updated to minimize a weighted sum of the two group losses computed with $f_\phi$:

$$J(\theta) = a\,\mathcal{L}_{G^\odot}(f_\phi) + b\,\mathcal{L}_{G^\otimes}(f_\phi), \qquad \theta \leftarrow \theta - \beta \nabla_\theta J(\theta)$$

The group weights $a$ and $b = 1 - a$ are given by a softmax over the two group losses with temperature $\tau$ (online group DRO). The group with the larger loss receives the larger weight: a large $\tau$ approaches the average loss of ERM, while $\tau \ll 1$ approaches explicitly selecting the worst-case group (the bias-conflicting samples). The gradient with respect to $\theta$ flows through $\phi$, using a first-order approximation as in MAML.

The key insight is that $\phi$ is regenerated from the updated $\theta$ at every step. Once $\theta$ becomes robust to the first bias, $\phi$, starting from that $\theta$, picks up the next bias that has not yet been addressed. This MAML-like structure, which ties bias discovery ($\phi$) and mitigation ($\theta$) into a single learning loop, enables sequential discovery and removal of multiple biases without any prior bias information.

The GradCAM visualizations below show how the biased model $f_\phi$'s attention shifts to different regions as training progresses, illustrating how ABD adaptively discovers diverse biases during learning.

![Biased Model Evolution](/images/accv2024/inner_vis2_compressed.webp)

<p class="caption">
GradCAM visualizations of an ERM-trained model and of ABD's biased model $f_\phi$ on MetaShift test images. As training epochs progress, the regions $f_\phi$ focuses on keep shifting.
</p>

### Theoretical Analysis

Group DRO minimizes the worst-case group loss over a group set $\mathcal{G}$ predefined with bias information. ABD instead discovers only a subset of biases at each step, which can be viewed as a stochastic selection of groups ($\mathcal{G}' \sim \mathcal{B}$). The gap $\text{Gap}(\theta)$ between group DRO's worst-case risk and ABD's expected worst-case risk is bounded as follows (Theorem 1):

$$\text{Gap}(\theta) \le \frac{2^{m-1}-1}{2^{m}-1}\,\Delta(\theta), \qquad \Delta(\theta) = \max_{g \in \mathcal{G}} \mathcal{L}_g(f_\theta) - \min_{g \in \mathcal{G}} \mathcal{L}_g(f_\theta)$$

where $m$ is the number of groups and $\Delta(\theta)$ is the maximum discrepancy in loss across groups. In other words, if ABD successfully identifies biases, it can perform comparably to group DRO, which relies on prior bias knowledge.

---

## Results

### Colored MNIST — Handling Multiple Biases

This experiment most clearly shows how ABD differs from existing methods, comparing a single-bias (Color) setting with a dual-bias (Color + Patch) setting.

<p class="caption">
OoD test accuracy (%). Single bias vs. multiple biases.
</p>

| Algorithm | Color (OoD) | Color & Patch (OoD) |
|:---|:---:|:---:|
| ERM | 16.4 | 14.0 |
| IRM | 66.9 | 13.4 |
| Group DRO | 13.6 | 14.1 |
| PI | 70.2 | 15.3 |
| **ABD (Ours)** | **70.7** | **62.3** |
| *Optimal* | *75.0* | *75.0* |

PI discovers only the Color bias and fails to capture Patch, effectively collapsing to 15.3% (a 54.9pp drop) when two biases are present. IRM and Group DRO also remain at the ERM level in the multi-bias setting. ABD sequentially discovers Color then Patch, making it the only method to achieve meaningful OoD performance (62.3%) under multiple biases.

<div class="figure-row">
<figure>
<img src="/images/accv2024/regroup_PI2.png" alt="PI Baseline" class="fig-pi">
<figcaption class="caption">(a) PI — captures only Color, misses Patch.</figcaption>
</figure>
<figure>
<img src="/images/accv2024/regroups_ours.png" alt="Bias Discovery - ABD" class="fig-abd">
<figcaption class="caption">(b) ABD — discovers Color, then Patch as training proceeds.</figcaption>
</figure>
</div>

<p class="caption">Pearson correlation between labels and bias features (Color, Patch) within each group ($G^\odot$, $G^\otimes$) on Colored MNIST.</p>

### Real-World Tasks

**Datasets with bias annotations — CivilComments & MultiNLI**

<p class="caption">
Worst-case test accuracy (%). The <em>Group</em> column for CivilComments lists the demographic information each algorithm uses for grouping. On MultiNLI, Group DRO* is an oracle setting using groups hand-crafted from prior bias knowledge.
</p>

| Algorithm | CivilComments | Group (CC) | MultiNLI |
|:---|:---:|:---:|:---:|
| ERM | 56.0 | *None* | 61.8 |
| IRM | 66.3 | *(label × Black)* | — |
| Group DRO | 69.1 | *(label)* | 62.7 |
| Group DRO | 70.0 | *(label × Black)* | — |
| JTT | 69.3 | *None* | 63.2 |
| PI | 61.1 | *None* | 61.5 |
| **ABD (Ours)** | **71.1** | *None* | **67.1** |
| *Group DRO\* (oracle)* | — | — | *67.5* |

**Datasets without bias annotations — Camelyon17 & FMoW (WILDS)**

<p class="caption">
Camelyon17-wilds reports OoD average accuracy; FMoW-wilds reports worst-region accuracy (%).
</p>

| Algorithm | Camelyon17 | FMoW |
|:---|:---:|:---:|
| ERM | 70.3 ± 6.4 | 32.3 ± 1.3 |
| IRM | 59.5 ± 7.7 | 31.7 ± 1.2 |
| Group DRO | 68.4 ± 7.3 | 30.8 ± 0.8 |
| CORAL | 59.5 ± 7.7 | 32.8 ± 0.7 |
| JTT | 63.8 ± 1.4 | 33.4 ± 0.9 |
| PI | 71.7 ± 7.5 | 31.2 ± 0.3 |
| CGD | 69.4 ± 7.9 | 32.0 ± 2.3 |
| LISA | 77.1 ± 6.5 | **35.5 ± 0.7** |
| **ABD (Ours)** | **81.1 ± 4.8** | 34.1 ± 2.5 |

On CivilComments, ABD (71.1%) **outperforms Group DRO trained with bias annotations (label × Black, 70.0%) while using no annotations itself**. On MultiNLI, ABD (67.1%) **comes within 0.4pp of the oracle Group DRO\* (67.5%)**, which relies on hand-crafted groups, without using any bias information. On Camelyon17, ABD outperforms LISA by 4.0pp (81.1% vs 77.1%) and remains competitive with it on FMoW. Invariance and distribution-alignment baselines (IRM, CORAL), as well as group-robust methods (Group DRO, CGD), stay at or below the ERM level on the WILDS benchmarks.

![MultiNLI Analysis](/images/accv2024/mnli_analysis3.webp)

<p class="caption">
Composition of bias features in the misclassified group $G^\otimes$ on MultiNLI. The negation bias is discovered first, after which the word-overlap bias gradually emerges.
</p>

### MetaShift — Performance Across Distributional Distances

On MetaShift, we vary the distributional distance between training and test to evaluate the robustness of each method. ABD achieves the highest accuracy at every distance from 0.71 upward, with the largest margin at the farthest distance (1.43).

<p class="caption">
MetaShift test accuracy (%). Larger distance indicates greater distributional shift.
</p>

| Distance | 0.44 | 0.71 | 1.12 | 1.43 |
|:---|:---:|:---:|:---:|:---:|
| ERM | 80.1 | 68.4 | 52.1 | 33.2 |
| IRM | 79.5 | 67.4 | 51.8 | 32.0 |
| Group DRO | 77.0 | 68.9 | 51.9 | 34.2 |
| LISA | **81.3** | 69.7 | 54.2 | 37.5 |
| **ABD (Ours)** | 80.4 | **71.8** | **55.2** | **41.8** |

At the smallest distance (0.44), LISA (81.3%) holds a slight edge, but from 0.71 onward ABD ranks first at every distance, and at 1.43 it surpasses LISA (37.5%) by 4.3pp (41.8%). This suggests that ABD is particularly well-suited to real-world OoD scenarios with large distributional shifts.

<img src="/images/accv2024/gradcam_compressed.webp" alt="GradCAM" style="max-width: 55%;">

<p class="caption">
GradCAM visualizations on MetaShift test data. ERM relies on background features, while ABD focuses on the target object.
</p>

---
