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
  image: "/videos/neurips2023-unlearning.jpg"
  alt: "Stochastic Unlearning Distribution Overlap"
  hidden: true
---

{{< paper-header
  venue="NeurIPS 2023 Competition"
  authors="Jaesin Ahn, Chaehyeon Lee, <strong>Jun-Hyun Bae</strong>, Junho Yim, Heechul Jung"
  affil="Kyungpook National University · LG Energy Solution"
  note="<strong>8th place out of 1,121 teams</strong> (final private leaderboard)"
  paper="https://www.kaggle.com/competitions/neurips-2023-machine-unlearning/writeups/forget-9th-place-solution-forget-set-free-approach"
  paperLabel="Writeup"
  competition="https://www.kaggle.com/competitions/neurips-2023-machine-unlearning"
>}}

{{< video src="/videos/neurips2023-unlearning.mp4" poster="/videos/neurips2023-unlearning.jpg" caption="Forget-set-free unlearning via stochastic re-initialization and noisy knowledge preservation" >}}

## Abstract

Recently, machine unlearning has received considerable attention, in the context of responsible artificial intelligence and privacy regulations. This technical report introduces novel machine unlearning methods, such as stochastic re-initialization, knowledge preserving loss, Gaussian noise, and forget-remember cycle. We present successful unlearning results, validated in the NeurIPS 2023 Machine Unlearning Challenge, accompanied by visualizations of logit distributions and several interim experiments.

---

## Overview

This method was submitted to the NeurIPS 2023 Machine Unlearning Challenge. It randomly re-initializes some model layers, then trains on the retain set to reproduce the original model's outputs. The process repeats for three or four cycles. The final algorithms do not use the forget set.

In intermediate experiments, random selection scored higher than FIM-based selection using forget-set gradients. The competition compared output distributions across 512 runs with those of retrained models, so varying which layers were reset could affect the evaluation. Repeating smaller resets with retain-set training between them also scored higher than increasing the reset ratio in a single cycle.

![Overall Architecture](/images/neurips2023-unlearning/overall.webp)

<p class="caption">Overall architecture. (a) Gaussian noise added to retain set images, (b) random layers selected for stochastic re-initialization, (c) knowledge preserving loss computed between the original and unlearning models, (d) steps (a)–(c) repeated for $n$ cycles.</p>

---

## Challenge

The task is to remove the influence of a forget set, consisting of images of 15 subjects, from a ResNet-18 trained on a hidden face age estimation dataset (about 30,000 images at 32×32). The rest of the training data forms the retain set, and successful unlearning should make the model indistinguishable from one retrained from scratch without the forget set (the retrained model). Submissions must complete 512 independent runs within 8 hours.

The competition metric is a **distribution-based unlearning quality** measure, not simple accuracy:

$$\text{Score} = \textcolor{#B84327}{F} \times \frac{\textcolor{#2A6F4E}{\mathrm{RA}_U}}{\textcolor{#2A6F4E}{\mathrm{RA}_R}} \times \frac{\textcolor{#1E4E79}{\mathrm{TA}_U}}{\textcolor{#1E4E79}{\mathrm{TA}_R}}$$

$F$ is forgetting quality, $\mathrm{RA}_U / \mathrm{RA}_R$ is the retain accuracy ratio (unlearned vs retrained), and $\mathrm{TA}_U / \mathrm{TA}_R$ is the test accuracy ratio. $F$ compares output distributions across 512 independent runs with those of retrained models. Models with the same retain/test accuracy can therefore receive different scores if their output distributions differ.

---

## Method

### Stochastic Re-initialization

We **randomly select and re-initialize** a subset of model layers, then fine-tune on the retain set. Choosing which parameters to re-initialize from the diagonal of the Fisher information matrix (FIM), computed with forget-set gradients, is intuitively appealing, but in practice it scores lower. We conjecture that because FIM picks the same parameters in every run, the 512 runs produce too narrow an output distribution to overlap well with that of the retrained models. Random selection provides this diversity naturally.

FC layers and projection-shortcut layers are excluded from the selection pool as they encode class/resolution information.

### Knowledge Preserving Loss

We train the model to reproduce the original model's outputs on the retain set via MSE loss:

$$\mathcal{L}_{\mathrm{KP}} = \mathbb{E}\!\left[\left|\textcolor{#1E4E79}{f_O(\mathbf{I}'_R)} - \textcolor{#B84327}{f_U(\mathbf{I}'_R)}\right|^2\right]$$

MSE loss (0.0680) outperforms both cross-entropy (0.0653) and L1 loss (0.0326).

### Gaussian Noise Augmentation

Adding Gaussian noise to retain set images provides randomness while achieving robust knowledge preservation. In the ablation, $\sigma=0.1$ is optimal (0.06532), outperforming both $\sigma=0.05$ (0.06333) and $\sigma=0.15$ (0.05907). Vertical flip (0.02505), random crop, and cutout (both 0.00001) cause scores to plummet, whereas Gaussian noise yields a modest improvement. Both final submitted algorithms use $\sigma=0.01$.

### Forget-Remember Cycles

Simply increasing the re-initialization ratio causes excessive forgetting. Raising the ratio from 10% to 20% in a single cycle actually decreases the score (0.0680 → 0.0656). Instead, **repeating 3–4 cycles** of forgetting and remembering progressively increases the effective re-initialization ratio while maintaining retain set performance. This cycle structure is the **single largest contributor** to performance improvement, with scores rising sharply from a single cycle (0.0680) to 2 cycles (0.0844) and slightly further at 3 cycles (0.0856).

**Algorithm hyperparameters.** The 1st algorithm uses 3 cycles of `[1, 2, 2]` epochs with a cosine learning rate scheduler (`init_lr=0.001`, `T_max=2`). The 2nd algorithm uses 4 cycles of `[2, 1, 1, 1]` epochs with per-epoch learning rates `[0.0005, 0.001, 0.001, 0.001, 0.001]`. Both algorithms select **6 layers with replacement** from the selection pool. The Gaussian noise is sampled from a distribution with zero mean and standard deviation 0.01.

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

We break down the contribution of each component sequentially.

<p class="caption">Core component ablations (interim experiment scores).</p>

| Component | Setting | Score |
|:---|:---|:---:|
| **Re-initialization** | Fine-tune (baseline) | 0.0496 |
| | + FIM-based Re-init | 0.0486 |
| | **+ Stochastic Re-init (random)** | **0.0617** |
| **Loss Function** | L1 Loss | 0.0326 |
| | CE Loss | 0.0653 |
| | **MSE Loss** | **0.0680** |
| **Forget–Remember Cycles** | 1 cycle (2 ep, 10%) | 0.0680 |
| | 1 cycle (2 ep, 20%) | 0.0656 |
| | 2 cycles (2–2 ep, ~20%) | 0.0844 |
| | **3 cycles (1–2–2 ep, ~30%)** | **0.0856** |
| **Selection Pool (~30%)** | None excluded | 0.0856 |
| | Exclude FC only | 0.0926 |
| | **Exclude FC & Projection-shortcut** | **0.0969** |

FIM-based re-initialization (0.0486) scores even below fine-tuning alone (0.0496), whereas random selection (0.0617) raises the score substantially. Among individual components, the **cycle structure** (0.0680 → 0.0856) yields the largest gain, followed by stochastic re-initialization (0.0496 → 0.0617) and **selection-pool restriction** (0.0856 → 0.0969). Additionally, layer-wise selection (0.0856) significantly outperforms element-wise selection (0.0575).

<p class="caption">Data augmentation ablation (10% Re-init, 3 ep).</p>

| Input Data | Score |
|:---|:---:|
| Clean Image | 0.06172 |
| Vertical Flip | 0.02505 |
| Random Crop / Cutout | 0.00001 |
| + Gaussian Noise ($\sigma=0.05$) | 0.06333 |
| **+ Gaussian Noise ($\sigma=0.10$)** | **0.06532** |
| + Gaussian Noise ($\sigma=0.15$) | 0.05907 |

### Logit Distribution

Comparing logit distributions on the forget and retain sets, our method produces distributions closer to those of the retrained model than fine-tuning does. Because the challenge dataset is hidden, these visualizations use the MUFAC dataset.

<div class="figure-row figure-row--grid">
<figure>
<img src="/images/neurips2023-unlearning/ft_forget_output_histogram.png" alt="Fine-tune forget logits">
<figcaption>(a) Fine-tune</figcaption>
</figure>
<figure>
<img src="/images/neurips2023-unlearning/kag_sub_v1_forget_output_histogram.png" alt="Ours 1st algo forget logits">
<figcaption>(b) 1st Algo.</figcaption>
</figure>
<figure>
<img src="/images/neurips2023-unlearning/kag_sub_v2_forget_output_histogram.png" alt="Ours 2nd algo forget logits">
<figcaption>(c) 2nd Algo.</figcaption>
</figure>
</div>

<p class="caption">Forget-set logit distributions (MUFAC). Fine-tuning is shifted to the right of the retrained model, whereas the main mass of both our algorithms overlaps it more closely.</p>

<div class="figure-row figure-row--grid">
<figure>
<img src="/images/neurips2023-unlearning/ft_retain_output_histogram.png" alt="Fine-tune retain logits">
<figcaption>(a) Fine-tune</figcaption>
</figure>
<figure>
<img src="/images/neurips2023-unlearning/kag_sub_v1_retain_output_histogram.png" alt="Ours 1st algo retain logits">
<figcaption>(b) 1st Algo.</figcaption>
</figure>
<figure>
<img src="/images/neurips2023-unlearning/kag_sub_v2_retain_output_histogram.png" alt="Ours 2nd algo retain logits">
<figcaption>(c) 2nd Algo.</figcaption>
</figure>
</div>

<p class="caption">Retain-set logit distributions (MUFAC). Fine-tuning is shifted to the right of the retrained model, while both algorithms largely overlap it.</p>

---
