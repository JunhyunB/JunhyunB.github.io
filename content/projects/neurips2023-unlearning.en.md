---
title: "Stochastic Unlearning with Knowledge Preserving Loss"
date: 2023-12-01
draft: false
tags: ["machine-unlearning", "privacy", "competition"]
summary: "NeurIPS 2023 Machine Unlearning Challenge — 8th / 1,121 teams"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/images/neurips2023-unlearning/overall.webp"
  alt: "Stochastic Unlearning overview"
  hidden: true
---

<div style="text-align: center; margin-bottom: 1rem;">
<span class="venue-badge">NeurIPS 2023 Competition</span><br>
<span style="color: var(--secondary);">Jaesin Ahn, Chaehyeon Lee, <strong>Jun-Hyun Bae</strong>, Junho Yim, Heechul Jung<br>
Kyungpook National University · LG Energy Solution<br>
<strong>8th place out of 1,121 teams</strong> (final private leaderboard)</span>
</div>

<div style="text-align: center; margin-bottom: 2rem;">
<a href="https://www.kaggle.com/competitions/neurips-2023-machine-unlearning/writeups/forget-9th-place-solution-forget-set-free-approach" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">📄 Writeup</a>
<a href="https://www.kaggle.com/competitions/neurips-2023-machine-unlearning" style="display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--primary); border-radius: 4px; margin: 0.2rem; text-decoration: none;">🏆 Competition</a>
</div>

## Abstract

Recently, machine unlearning has received considerable attention, in the context of responsible artificial intelligence and privacy regulations. This technical report introduces novel machine unlearning methods, such as stochastic re-initialization, knowledge preserving loss, Gaussian noise, and forget-remember cycle. We present successful unlearning results, validated in the NeurIPS 2023 Machine Unlearning Challenge, accompanied by visualizations of logit distributions and several interim experiments.

---

## Overview

We propose a machine unlearning method that effectively removes the influence of specific data using only the retain set, without accessing the forget set or retraining from scratch.

1. **Stochastic re-initialization** — Randomly select and re-initialize model layers to probabilistically destroy memories of specific data.
2. **Knowledge preserving** — Reproduce the original model's outputs on the retain set via MSE loss to maintain performance.
3. **Forget-remember cycles** — Repeat forgetting and remembering phases 3–4 times, progressively increasing the re-initialization ratio while preserving retain set performance.

![Overall Architecture](/images/neurips2023-unlearning/overall.webp)

<p class="caption">Overall architecture. (a) Gaussian noise added to retain set images, (b) random layers selected for stochastic re-initialization, (c) knowledge preserving loss computed between the original and unlearning models, (d) steps (a)–(c) repeated for $n$ cycles.</p>

---

## Challenge

The task is to remove the influence of a forget set, consisting of images of 15 subjects, from a ResNet-18 trained on a hidden face age estimation dataset (about 30,000 images at 32×32). The rest of the training data forms the retain set, and successful unlearning should make the model indistinguishable from one retrained from scratch without the forget set (the retrained model). Submissions must complete 512 independent runs within 8 hours.

The competition metric is a **distribution-based unlearning quality** measure, not simple accuracy:

$$\text{Score} = F \times \frac{RA_U}{RA_R} \times \frac{TA_U}{TA_R}$$

$F$ is forgetting quality, $RA_U / RA_R$ is the retain accuracy ratio (unlearned vs retrained), and $TA_U / TA_R$ is the test accuracy ratio. Crucially, this metric evaluates the **output distribution across 512 independent runs**. Since the distribution across runs — not single-run performance — must resemble the retrained model's distribution, the algorithm requires an appropriate level of **randomness**.

---

## Method

### Stochastic Re-initialization

We **randomly select and re-initialize** a subset of model layers, then fine-tune on the retain set. Choosing which parameters to re-initialize from the diagonal of the Fisher information matrix (FIM), computed with forget-set gradients, is intuitively appealing, but in practice it scores lower. We conjecture that because FIM picks the same parameters in every run, the 512 runs produce too narrow an output distribution to overlap well with that of the retrained models. Random selection provides this diversity naturally.

FC layers and projection-shortcut layers are excluded from the selection pool as they encode class/resolution information.

### Knowledge Preserving Loss

We train the model to reproduce the original model's outputs on the retain set via MSE loss:

$$\mathcal{L}_{KP} = \mathbb{E}\left[|f_O(\mathbf{I}'_R) - f_U(\mathbf{I}'_R)|^2\right]$$

MSE loss (0.0680) outperforms both cross-entropy (0.0653) and L1 loss (0.0326).

### Gaussian Noise Augmentation

Adding Gaussian noise to retain set images provides randomness while achieving robust knowledge preservation. In the ablation, $\sigma=0.1$ is optimal (0.06532), outperforming both $\sigma=0.05$ (0.06333) and $\sigma=0.15$ (0.05907). Vertical flip (0.02505), random crop, and cutout (both 0.00001) cause scores to plummet, whereas Gaussian noise yields a modest improvement. Both final submitted algorithms use $\sigma=0.01$.

### Forget-Remember Cycles

Simply increasing the re-initialization ratio causes excessive forgetting. Raising the ratio from 10% to 20% in a single cycle actually decreases the score (0.0680 → 0.0656). Instead, **repeating 3–4 cycles** of forgetting and remembering progressively increases the effective re-initialization ratio while maintaining retain set performance. This cycle structure is the **single largest contributor** to performance improvement, with scores rising sharply from a single cycle (0.0680) to 2 cycles (0.0844) and slightly further at 3 cycles (0.0856).

**Algorithm hyperparameters.** The 1st algorithm uses 3 cycles of `[1, 2, 2]` epochs with a cosine learning rate scheduler ($init\_lr=0.001$, $T\_max=2$). The 2nd algorithm uses 4 cycles of `[2, 1, 1, 1]` epochs with per-epoch learning rates `[0.0005, 0.001, 0.001, 0.001, 0.001]`. Both algorithms select **6 layers with replacement** from the selection pool. The Gaussian noise is sampled from a distribution with zero mean and standard deviation 0.01.

---

## Results

### Quantitative

Scores are from the competition's public leaderboard; Fine-tune is the starter code provided by the organizers.

| Model | Score |
|---|---|
| Negrad | 0.0001 (±0.0001) |
| Fine-tune (baseline) | 0.0464 (±0.0031) |
| 1st Algo. (ours) | 0.0939 (±0.0065) |
| 2nd Algo. (ours) | 0.0929 (±0.0051) |
| 1st Algo. (ours, best) | 0.1020 |
| **2nd Algo. (ours, best)** | **0.1024** |

### Ablation Study

We analyze the contribution of each component sequentially.

**Re-initialization.**

| Experiment | Score |
|---|---|
| Fine-tune | 0.0496 |
| + Stochastic Re-init (random) | **0.0617** |
| + FIM-based Re-init | 0.0486 |

**Data Augmentation (10% Re-init, 3 ep).**

| Input Data | Score |
|---|---|
| Clean Image | 0.06172 |
| Vertical Flip | 0.02505 |
| Random Crop | 0.00001 |
| Cutout | 0.00001 |
| + Gaussian Noise ($\sigma=0.05$) | 0.06333 |
| + Gaussian Noise ($\sigma=0.15$) | 0.05907 |
| **+ Gaussian Noise ($\sigma=0.1$)** | **0.06532** |

**Loss Functions.**

| Loss | Score |
|---|---|
| CE Loss | 0.0653 |
| L1 Loss | 0.0326 |
| **MSE Loss** | **0.0680** |

**Number of Cycles.**

| Cycles | Selection Ratio | Score |
|---|---|---|
| 1 (2 ep) | 10% | 0.0680 |
| 1 (2 ep) | 20% | 0.0656 |
| 2 (2-2 ep) | ~20% | 0.0844 |
| **3 (1-2-2 ep)** | ~30% | **0.0856** |

**Selection Pool (Layer Exclusion).**

| Excluded Layers | Selection Ratio | Score |
|---|---|---|
| None | ~30% | 0.0856 |
| FC only | ~30% | 0.0926 |
| **FC & Projection-shortcut** | ~30% | **0.0969** |

FIM-based re-initialization (0.0486) scores even below fine-tuning alone (0.0496), whereas random selection (0.0617) raises the score substantially. Among individual components, the **cycle structure** (0.0680 → 0.0856) yields the largest gain, followed by stochastic re-initialization (0.0496 → 0.0617) and **selection-pool restriction** (0.0856 → 0.0969).

Additionally, layer-wise selection (0.0856) significantly outperforms element-wise selection (0.0575).

### Logit Distribution

Comparing logit distributions on the forget and retain sets, our method produces distributions closer to those of the retrained model than fine-tuning does. Because the challenge dataset is hidden, these visualizations use the MUFAC dataset.

<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1.5rem 0;">
<div style="text-align: center;">
<img src="/images/neurips2023-unlearning/ft_forget_output_histogram.png" alt="Fine-tune forget logits" style="max-width: 280px;">
<p class="caption">(a) Fine-tune</p>
</div>
<div style="text-align: center;">
<img src="/images/neurips2023-unlearning/kag_sub_v1_forget_output_histogram.png" alt="Ours 1st algo forget logits" style="max-width: 280px;">
<p class="caption">(b) 1st Algo.</p>
</div>
<div style="text-align: center;">
<img src="/images/neurips2023-unlearning/kag_sub_v2_forget_output_histogram.png" alt="Ours 2nd algo forget logits" style="max-width: 280px;">
<p class="caption">(c) 2nd Algo.</p>
</div>
</div>

<p class="caption">Forget-set logit distributions (MUFAC). Fine-tuning is shifted to the right of the retrained model, whereas the main mass of both our algorithms overlaps it more closely.</p>

<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin: 1.5rem 0;">
<div style="text-align: center;">
<img src="/images/neurips2023-unlearning/ft_retain_output_histogram.png" alt="Fine-tune retain logits" style="max-width: 280px;">
<p class="caption">(a) Fine-tune</p>
</div>
<div style="text-align: center;">
<img src="/images/neurips2023-unlearning/kag_sub_v1_retain_output_histogram.png" alt="Ours 1st algo retain logits" style="max-width: 280px;">
<p class="caption">(b) 1st Algo.</p>
</div>
<div style="text-align: center;">
<img src="/images/neurips2023-unlearning/kag_sub_v2_retain_output_histogram.png" alt="Ours 2nd algo retain logits" style="max-width: 280px;">
<p class="caption">(c) 2nd Algo.</p>
</div>
</div>

<p class="caption">Retain-set logit distributions (MUFAC). Fine-tuning is shifted to the right of the retrained model, while both algorithms largely overlap it.</p>

---
