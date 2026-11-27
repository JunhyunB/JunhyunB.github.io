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
  image: "/videos/accv2024-abd.jpg"
  alt: "Adaptive Bias Discovery"
  hidden: true
---

{{< paper-header
  venue="ACCV 2024"
  authors="<strong>Jun-Hyun Bae</strong>, Minho Lee, Heechul Jung"
  affil="Kyungpook National University"
  paper="https://openaccess.thecvf.com/content/ACCV2024/html/Bae_Adaptive_Bias_Discovery_for_Learning_Debiased_Classifier_ACCV_2024_paper.html"
>}}

{{< video src="/videos/accv2024-abd.mp4" poster="/videos/accv2024-abd.jpg" caption="Navigating multiple unknown biases by adapting the auxiliary bias model at every step" >}}

## Abstract

Training deep neural networks with empirical risk minimization (ERM) often captures dataset biases, hindering generalization to new or unseen data. Previous solutions either require prior knowledge of biases or utilize training intentionally biased models as auxiliaries; however, they still suffer from multiple biases. To address this, we introduce Adaptive Bias Discovery (ABD), a novel learning framework designed to mitigate the impact of multiple unknown biases. ABD trains an auxiliary model to be adapted to biases based on the debiased parameters from the debiasing phase, allowing it to navigate through multiple biases. Then, samples are reweighted based on the discovered biases to update debiased parameters. Extensive evaluations of synthetic experiments and real-world datasets demonstrate that ABD consistently outperforms existing methods, particularly in real-world applications where multiple unknown biases are prevalent.

---

## Overview

Adding both color and patch biases to Colored MNIST causes methods that handle color alone to fail. PI identifies the color bias but misses the patch: its OOD accuracy falls from 70.2% with color alone to 15.3% when the patch is added.

ABD rebuilds its auxiliary bias-discovery model at every training step. A few gradient updates from the current model produce an auxiliary model that partitions the data; group losses then update the current parameters. The groups change with the model instead of remaining tied to a fixed auxiliary model. In our experiments, patch bias emerges after color bias, and ABD reaches 62.3% OOD accuracy with both biases present.

![ABD Framework](/images/accv2024/method.webp)

<p class="caption">
Overview of the ABD framework, illustrated with two biases (Bias1, Bias2) and two learning steps. Bias1 is a simpler feature that neural networks learn more readily than Bias2; initializing the auxiliary model from the debiased parameters lets it focus on biases not yet discovered.
</p>

---

## Method

Models trained with ERM can rely on correlations that hold only in the training data. Group DRO emphasizes high-loss groups, so the choice of groups matters. Approaches such as PI and JTT use a separately trained biased model to partition data; if that model captures only the dominant bias, other biases can be missed.

ABD alternates between bias discovery and mitigation. First, gradient descent from the current parameters gives $\phi = \theta - \alpha \nabla_\theta \mathcal{L}(f_\theta)$ (one step is shown; multiple steps are possible, with three used on Colored MNIST). This exploits the tendency to learn easy features quickly to obtain a bias-sensitive auxiliary model. Correct predictions form $G^\odot$ and incorrect predictions form $G^\otimes$. These are **proxies** for bias-aligned and bias-conflicting groups, not observed bias annotations.

Next, $\theta$ is updated to minimize a weighted sum of the two group losses computed with $f_\phi$:

$$J(\theta) = \textcolor{#1E4E79}{a\,\mathcal{L}_{G^\odot}(f_\phi)} + \textcolor{#B84327}{b\,\mathcal{L}_{G^\otimes}(f_\phi)}, \qquad \theta \leftarrow \theta - \beta \nabla_\theta J(\theta)$$

The weights $a$ and $b = 1 - a$ come from a softmax over group losses with temperature $\tau$ (online group DRO). Large $\tau$ gives similar weights to the two group-average losses; $\tau \ll 1$ concentrates on the higher-loss group. The gradient with respect to $\theta$ flows through $\phi$, using a first-order approximation as in MAML.

$\phi$ is regenerated from the updated $\theta$ at every step. As reliance on one bias decreases, the bias captured by the auxiliary model can change. The experiments observe Color followed by Patch on Colored MNIST, and Negation followed by Overlap on MultiNLI.

The GradCAM visualizations below show how the biased model $f_\phi$'s attention shifts to different regions as training progresses, illustrating how ABD adaptively discovers diverse biases during learning.

![Biased Model Evolution](/images/accv2024/inner_vis2_compressed.webp)

<p class="caption">
GradCAM visualizations of an ERM-trained model and of ABD's biased model $f_\phi$ on MetaShift test images. As training epochs progress, the regions $f_\phi$ focuses on keep shifting.
</p>

### Theoretical Analysis

Theorem 1 compares worst-case risk over the complete group set $\mathcal{G}$ with expected worst-case risk over selected groups $\mathcal{G}' \sim \mathcal{B}$. For fixed $\theta$, assuming every nonempty subset is selected with equal probability, the difference is bounded as follows:

$$\text{Gap}(\theta) \le \frac{2^{m-1}-1}{2^{m}-1}\,\textcolor{#B84327}{\Delta(\theta)}, \qquad \textcolor{#B84327}{\Delta(\theta)} = \max_{g \in \mathcal{G}} \mathcal{L}_g(f_\theta) - \min_{g \in \mathcal{G}} \mathcal{L}_g(f_\theta)$$

Here $m$ is the number of groups, $\Delta(\theta)$ is the maximum difference between group losses, and each subset has probability $1/(2^m-1)$. The proof is in the [supplement](https://openaccess.thecvf.com/content/ACCV2024/supplemental/Bae_Adaptive_Bias_Discovery_ACCV_2024_supplemental.pdf).

---

## Results

### Colored MNIST — Handling Multiple Biases

The experiment compares a single-bias (Color) setting with a dual-bias (Color + Patch) setting.

<p class="caption">
OOD test accuracy (%, mean of five runs). Single bias versus multiple biases. Group DRO in this table is not given explicit bias information.
</p>

| Algorithm | Color (OOD) | Color & Patch (OOD) |
|:---|:---:|:---:|
| ERM | 16.4 | 14.0 |
| IRM | 66.9 | 13.4 |
| Group DRO | 13.6 | 14.1 |
| PI | 70.2 | 15.3 |
| **ABD (Ours)** | **70.7** | **62.3** |
| *Optimal* | *75.0* | *75.0* |

PI reaches 70.2% with Color alone but falls to 15.3% when Patch is added. The group analysis below shows PI capturing Color and missing Patch, while ABD exposes Color followed by Patch. ABD is the strongest method in this comparison at 62.3%, but remains below the ideal bias-independent accuracy of 75.0%. Group DRO here should be distinguished from an oracle given the correct bias information.

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
Camelyon17-wilds reports OOD average accuracy; FMoW-wilds reports worst-region accuracy (%).
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

At the smallest distance (0.44), LISA (81.3%) holds a slight edge, but from 0.71 onward ABD ranks first at every distance, and at 1.43 it surpasses LISA (37.5%) by 4.3pp (41.8%). This suggests that ABD is particularly well-suited to real-world OOD scenarios with large distributional shifts.

<img src="/images/accv2024/gradcam_compressed.webp" alt="GradCAM" style="max-width: 55%;">

<p class="caption">
GradCAM visualizations on MetaShift test data. ERM relies on background features, while ABD focuses on the target object.
</p>

### Label Noise

In the supplement's unbiased MNIST experiment with 25% training label noise, ABD reaches 58.0% while ERM reaches 73.0%. We attribute this degradation to the discovery stage treating label noise as bias. Grouping samples by prediction errors can also pick up errors caused by incorrect labels.

---
