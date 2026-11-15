---
title: "Meta-Learned Invariant Risk Minimization"
date: 2021-03-24
draft: false
tags: ["invariant-risk-minimization", "meta-learning", "out-of-distribution"]
summary: "arXiv Preprint, 2021 — Jun-Hyun Bae, Inchul Choi, Minho Lee"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/meta-irm/grad.png"
  alt: "Meta-IRM diagram"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">arXiv 2021</span><br>
<span style="color: var(--secondary);"><strong>Jun-Hyun Bae</strong>, Inchul Choi, Minho Lee<br>
Kyungpook National University</span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://arxiv.org/abs/2103.12947" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Paper</a>
</div>

## Abstract

Empirical Risk Minimization (ERM) based machine learning algorithms have suffered from weak generalization performance on data obtained from out-of-distribution (OOD). To address this problem, Invariant Risk Minimization (IRM) objective was suggested to find invariant optimal predictor which is less affected by the changes in data distribution. However, even with such progress, IRMv1, the practical formulation of IRM, still shows performance degradation when there are not enough training data, and even fails to generalize to OOD, if the number of spurious correlations is larger than the number of environments. In this paper, to address such problems, we propose a novel meta-learning based approach for IRM. In this method, we do not assume the linearity of classifier for the ease of optimization, and solve ideal bi-level IRM objective with Model-Agnostic Meta-Learning (MAML) framework. Our method is more robust to the data with spurious correlations and can provide an invariant optimal classifier even when data from each distribution are scarce. In experiments, we demonstrate that our algorithm not only has better OOD generalization performance than IRMv1 and all IRM variants, but also addresses the weakness of IRMv1 with improved stability.

---

## Overview

A small IRMv1 gradient penalty can accompany poor OoD performance. This paper examines the problem with limited data per environment and multiple spurious features, and implements IRM's bi-level structure through meta-learning.

meta-IRM adapts parameters in one training environment, then updates the original parameters using loss from another training environment. This assigns different environments to MAML's inner and outer loops. On Colored MNIST, the variant using the same environment in both loops reaches 13.6% OoD accuracy, compared with 70.4% for the full method using different environments.

![Meta-IRM Diagram](/images/meta-irm/grad.png)

<p class="caption">Conceptual diagram of meta-IRM. Parameters adapted to one environment ($\theta'_1$, $\theta'_2$) are evaluated in another, and their meta-loss gradients encourage a solution that depends less on the environment. The illustrated $\theta_{optimal}$ is the intended target, not a guarantee of convergence under all conditions.</p>

---

## Method

IRM seeks a representation for which a common classifier is optimal across training environments. The original objective is difficult because its constraints contain environment-specific optimization problems. The practical IRMv1 formulation fixes the classifier to a scalar and approximates these constraints with a gradient penalty. With insufficient data or many spurious features relative to the number of environments, a small penalty can still accompany poor OoD performance. The reduced-data and multiple-bias experiments below examine these cases.

meta-IRM implements IRM's bi-level structure through a MAML-based learning procedure. Its key choice is **assigning different training environments to the inner and outer loops**. Evaluating adaptation in another environment encourages features that transfer across environments. This is not a guarantee of exactly solving the original constrained problem or converging to its global optimum.

### Meta-Learning Framework

MAML's inner loop handles environment-specific adaptation, while the outer loop reduces risk evaluated in other environments. The actual inner update applies to the model parameters $\theta$, rather than explicitly updating only the classifier. Unlike IRMv1, the classifier is not restricted to a fixed linear function.

**Inner optimization**: Adapt model parameters to each training environment $e_i$:

$$\theta_i' = \theta - \alpha \nabla_\theta R^{e_i}(f_\theta)$$

**Meta-optimization**: Update $\theta$ using meta-losses computed from **different environments** $e_j$ with adapted parameters $\theta_i'$:

$$\theta \leftarrow \theta - \beta \nabla_\theta \left\{ \sum_i \sum_j R^{e_j}(f_{\theta_i'}) + \lambda \sigma \right\}, \quad e_j \sim \mathcal{E}_{tr} \setminus e_i$$

![Learning Process](/images/meta-irm/schematic.webp)

<p class="caption">Schematic of the meta-IRM learning process. Model parameters $\theta$ are adapted to each training environment in the inner optimization, and the meta-loss of each adapted parameter set is computed on the other environments.</p>

### Auxiliary Standard Deviation Loss

An auxiliary loss based on the standard deviation $\sigma$ of meta-losses encourages **uniform performance** across all environments. This regularization improves training stability and convergence speed. $\lambda$ weights this auxiliary loss.

---

## Results

### Colored MNIST

Digits 0–4 and 5–9 form two classes, and labels are flipped with probability 0.25 (label noise), so digit shape alone can be right at most 75% of the time. Color is assigned by flipping the label with probability $p_e$: it agrees with the label 90% and 80% of the time in the training environments ($p_e=0.1, 0.2$), and the relation is reversed in the test environment ($p_e=0.9$). An ideal model that ignores color therefore reaches 75%.

<p class="caption">Test accuracy (%) on Colored MNIST. $p_e=0.9$ is the OOD environment (reversed color-label correlation).</p>

| Algorithm | $p_e=0.1$ | $p_e=0.2$ | $p_e=0.9$ (OOD) |
|:---|:---:|:---:|:---:|
| ERM | 88.6 ± 0.3 | 79.7 ± 0.6 | 16.4 ± 0.8 |
| IRMv1 | 71.4 ± 0.9 | 70.8 ± 1.0 | 66.9 ± 2.5 |
| MM-REx | 70.8 ± 1.5 | 70.4 ± 2.0 | 66.1 ± 4.9 |
| V-REx | 71.5 ± 0.8 | 71.1 ± 0.9 | 68.6 ± 1.2 |
| **meta-IRM (Ours)** | 70.9 ± 0.9 | 70.8 ± 1.0 | **70.4 ± 0.9** |
| *Random* | *50* | *50* | *50* |
| *ERM (grayscale)* | *72.6 ± 0.3* | *72.7 ± 0.3* | *73.0 ± 0.5* |
| *Optimal* | *75* | *75* | *75* |

Among the compared methods receiving colored inputs, meta-IRM has the highest OoD accuracy (70.4%) and a smaller run-to-run standard deviation than V-REx (68.6%), IRMv1 (66.9%), and MM-REx (66.1%). ERM (grayscale), with color removed in advance, is a separate reference at 73.0%. The nearly flat accuracy curve as color–label correlations change supports the interpretation that meta-IRM relies less on color.

![Various Test Environments](/images/meta-irm/various_models.png)

<p class="caption">Accuracy across test environments ($p_e$ from 0.1 to 0.9).</p>

### Multi-Class Problem

As the number of classes increases, the structure of spurious correlations becomes more complex, and meta-IRM's advantage becomes more pronounced.

<p class="caption">Train and test accuracy (%) on multi-class Colored MNIST ($k$=5, 10). ERM, IRMv1, and ERM (grayscale) results are cited from Choe et al. (2020).</p>

| Algorithm | # Classes | Train | Test (OOD) |
|:---|:---:|:---:|:---:|
| ERM | 5 | 95.2 ± 0.2 | 41.0 ± 0.6 |
| IRMv1 | 5 | 82.2 ± 0.4 | 62.0 ± 2.4 |
| **meta-IRM (Ours)** | **5** | 76.4 ± 1.4 | **74.0 ± 3.6** |
| *Random* | *5* | *20* | *20* |
| *ERM (grayscale)* | *5* | *73.2 ± 0.2* | *71.7 ± 0.4* |
| ERM | 10 | 92.6 ± 0.2 | 39.2 ± 0.9 |
| IRMv1 | 10 | 83.4 ± 0.5 | 58.6 ± 2.5 |
| **meta-IRM (Ours)** | **10** | 79.5 ± 0.6 | **73.4 ± 3.2** |
| *Random* | *10* | *10* | *10* |
| *ERM (grayscale)* | *10* | *73.2 ± 0.1* | *71.9 ± 0.5* |
| *Optimal* | — | *75* | *75* |

With ten classes, meta-IRM reaches 73.4% OoD accuracy, 14.8pp above IRMv1 (58.6%). The ERM (grayscale) reference is 71.9%. Mean accuracy is high for both five and ten classes, but run-to-run standard deviations are larger than in the two-class setting (3.6 and 3.2 versus 0.9).

### Insufficient Data

We evaluate how well IRM-family methods maintain performance when training data is halved (25,000 to 12,500 per environment).

<p class="caption">Test accuracy (%) with reduced training data (12,500 per environment).</p>

| Algorithm | $p_e=0.1$ | $p_e=0.2$ | $p_e=0.9$ (OOD) |
|:---|:---:|:---:|:---:|
| IRMv1 | 73.2 ± 1.6 | 71.7 ± 1.3 | 58.5 ± 2.5 |
| V-REx | 75.0 ± 0.8 | 73.4 ± 0.6 | 61.3 ± 1.4 |
| **meta-IRM (Ours)** | 70.6 ± 1.5 | 70.5 ± 1.6 | **68.3 ± 2.3** |
| *Optimal* | *75* | *75* | *75* |

When data is halved, IRMv1 drops from 66.9% to 58.5% (8.4pp), while meta-IRM drops from 70.4% to 68.3% (2.1pp). In this setting, meta-IRM better preserves OoD performance as data becomes scarce.

![Data Decrease](/images/meta-irm/data_decrease.webp)

<p class="caption">Effect of decreasing training data (25,000 → 12,500 → 6,250). Top to bottom: IRMv1, V-REx, meta-IRM. With less data, IRMv1 and V-REx start to behave like ERM, with accuracy dropping sharply as $p_e$ increases, while meta-IRM stays nearly flat.</p>

### Two Spurious Features

This setting introduces 2 spurious correlations (color + patch) with only 2 training environments. IRMv1's theoretical guarantee requires more environments than spurious features, so it does not hold here, where the two numbers are equal.

| Algorithm | $p_e=0.1$ | $p_e=0.2$ | $p_e=0.9$ (OOD) |
|:---|:---:|:---:|:---:|
| IRMv1 | 93.5 ± 0.2 | 86.4 ± 0.3 | 13.4 ± 0.3 |
| V-REx | 93.6 ± 0.4 | 86.3 ± 0.3 | 13.5 ± 0.3 |
| **meta-IRM (Ours)** | 58.1 ± 3.1 | 56.8 ± 2.9 | **54.5 ± 4.0** |
| *Optimal* | *75* | *75* | *75* |

IRMv1 and V-REx perform well when correlations match the training environments, but fall to 13.4–13.5% when both correlations reverse. meta-IRM mitigates that failure at 54.5 ± 4.0%. Its mean remains only modestly above chance (50%) and well below the ideal 75%, so the multiple-bias problem is far from solved.

![Two Spurious Features](/images/meta-irm/2s.png)

<p class="caption">Test accuracy with two spurious features (color + patch) across environments.</p>

### PunctuatedSST-2 (NLP)

We test whether the findings on Colored MNIST carry over to NLP using PunctuatedSST-2, a sentiment analysis task where punctuation marks ("!" vs ".") serve as spurious features.

<p class="caption">PunctuatedSST-2 test accuracy (%). $\eta_e$ is the label noise rate.</p>

| Algorithm | $\eta_e$ | Test (OOD) |
|:---|:---:|:---:|
| ERM | 0.25 | 30.7 ± 1.5 |
| IRMv1 | 0.25 | 62.0 ± 1.9 |
| **meta-IRM (Ours)** | **0.25** | **62.2 ± 1.8** |
| *ERM (vanilla)* | *0.25* | *62.3 ± 0.5* |
| *Optimal* | *0.25* | *75* |
| ERM | 0 | 56.2 ± 2.9 |
| IRMv1 | 0 | 67.4 ± 1.4 |
| **meta-IRM (Ours)** | **0** | **73.0 ± 0.7** |
| *ERM (vanilla)* | *0* | *76.7 ± 2.7* |
| *Optimal* | *0* | *100* |

Without label noise ($\eta_e=0$), meta-IRM (73.0%) surpasses IRMv1 (67.4%) by 5.6pp and approaches the ERM (vanilla) reference (76.7%), trained on SST-2 without the punctuation spurious feature. With label noise ($\eta_e=0.25$), both meta-IRM (62.2%) and IRMv1 (62.0%) reach the level of ERM trained on vanilla SST-2 (62.3%), so the two methods are practically indistinguishable in this setting.

### Ablation Study

| Variant | $p_e=0.1$ | $p_e=0.9$ (OOD) |
|:---|:---:|:---:|
| w/o std. loss | 73.0 ± 0.8 | 64.2 ± 3.2 |
| First-order approx. | 62.6 ± 5.5 | 59.1 ± 6.3 |
| Same env. (inner = meta) | 89.3 ± 1.6 | 13.6 ± 6.6 |
| **meta-IRM (Full)** | 70.9 ± 0.9 | **70.4 ± 0.9** |
| *Optimal* | *75* | *75* |

The **same environment (inner = meta)** variant collapses to 13.6%, exhibiting an ERM-level failure. This shows that **assigning different environments to the inner and outer loops** is the core mechanism of meta-IRM. First-order approximation degrades both performance and stability due to the loss of second-order gradient information (59.1 ± 6.3%). Removing the standard deviation loss reduces OOD performance by 6.2pp and increases the run-to-run standard deviation (3.2 vs 0.9).

---
