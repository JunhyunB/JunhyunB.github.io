---
title: "Surgical MLP Editing for Unlearning with Cross-Layer Transcoders"
date: 2026-11-25
draft: false
tags: ["machine-unlearning", "mechanistic-interpretability", "large-language-models"]
summary: "EACL 2027 — Sangjin Kim*, Jun-Hyun Bae*, Heechul Jung"
ShowToc: false
ShowReadingTime: false
ShowShareButtons: false
hideMeta: true
cover:
  image: "/videos/eacl2027-surgical-mlp-editing.jpg"
  alt: "Surgical MLP Editing with Cross-Layer Transcoders"
  hidden: true
---

{{< paper-header
  venue="EACL 2027"
  authors="Sangjin Kim*, <strong>Jun-Hyun Bae</strong>*, Heechul Jung"
  affil="Kyungpook National University"
  note="* Equal Contribution"
>}}

{{< video src="/videos/eacl2027-surgical-mlp-editing.mp4" poster="/videos/eacl2027-surgical-mlp-editing.jpg" caption="Locating target knowledge with Cross-Layer Transcoders and distilling surgical MLP edits" >}}

## Abstract

As large language models lower the barrier to accessing scientific and technical knowledge, they also increase the need for unlearning methods that reduce targeted hazardous capabilities while preserving broad utility. Most existing unlearning methods optimize losses on forget and retain sets, but do not identify the internal computations that give rise to the resulting behavioral change. Motivated by prior work showing that Transformer MLP blocks store and mediate factual knowledge, we frame unlearning as a problem of modifying feature-level contributions to MLP outputs. We propose a method for identifying target-associated MLP-level features using a Cross-Layer Transcoder (CLT), converting their decoder contributions into feature-removed MLP-output targets, and training MLP parameters to match those targets. Our method substantially reduces WMDP-Bio accuracy while maintaining performance close to the original model on retain benchmarks. Additional MLP-output probe and semantic-grouped generation analyses help characterize which behaviors are attenuated by the learned update. These results suggest that CLT-guided unlearning offers a practical mechanistic route toward targeted unlearning in language models.

---

## Overview

Most LLM unlearning methods update the model with losses on a forget set and a retain set. The target benchmark score drops, but it is hard to say what changed inside the model. Here we focus on MLP blocks, which prior work has linked to storing and processing factual knowledge, and treat unlearning as removing the feature-level contributions to MLP outputs that are tied to the target knowledge.

The tool is a Cross-Layer Transcoder (CLT). A CLT encodes each layer's MLP input into sparse features and rebuilds the MLP output by adding the decoder contributions of features active at that layer and earlier ones. The method picks features that fire far more on the forget corpus, subtracts their decoder contributions to form target outputs, and trains the MLPs to produce those outputs. The CLT is used only during training, so the final model runs an ordinary forward pass with no CLT or activation hooks. On Gemma-2-2B, WMDP-Bio accuracy falls from 56.79% to 34.72% while the retain benchmarks stay close to the original model.

![CLT-guided MLP unlearning](/images/eacl2027/clt-mlp-unlearning.png)

<p class="caption">
Overview of CLT-guided unlearning. CLT features locate MLP-level contributions associated with the target capability; the corresponding decoder contributions are removed, and the resulting behavior is distilled into MLP parameters.
</p>

---

## Method

### Cross-Layer Transcoder

At layer $\ell$, let $\mathbf{x}^{\ell}$ be the layer-normalized hidden state just before the MLP and $\mathbf{y}^{\ell}$ the raw MLP output before residual addition. The CLT encoder computes nonnegative sparse feature activations, and the decoder rebuilds the MLP output from the contributions of features at the current and earlier layers:

$$\textcolor{#A86A14}{\mathbf{a}^{\ell}} = \phi\!\left(\mathbf{x}^{\ell}W^{\ell}_{\mathrm{enc}}\right), \qquad \widehat{\mathbf{y}}^{\ell} = \sum_{\ell' \leq \ell} \textcolor{#A86A14}{\mathbf{a}^{\ell'}} W_{\mathrm{dec}}^{\ell'\rightarrow\ell}$$

$\widehat{\mathbf{y}}^{\ell}$ approximates the actual MLP output $\mathbf{y}^{\ell}$. Restricting $\mathbf{a}^{\ell'}$ to a subset of features and multiplying by $W_{\mathrm{dec}}^{\ell'\rightarrow\ell}$ gives that subset's share of layer $\ell$'s output. We use these decoder contributions as the basic units of unlearning.

### Selecting removal features

CLT activation statistics are collected on the forget and retain corpora ($c \in \{f, r\}$). For feature $i$ at layer $\ell$, $P^{c}_{i,\ell}$ counts the tokens where the feature is active and $M^{c}_{i,\ell}$ sums its activations (activation mass):

$$\mathrm{score}_{i,\ell} = \textcolor{#B84327}{M^{f}_{i,\ell}} - \textcolor{#1E4E79}{M^{r}_{i,\ell}}, \qquad R_{i,\ell} = \frac{\textcolor{#B84327}{M^{f}_{i,\ell}}}{\textcolor{#1E4E79}{M^{r}_{i,\ell}}+1}$$

Only features that fire often enough on the forget corpus, have a large $R$, and have a positive score are kept. A shortlist is formed by the active-token excess ($P^f - P^r$) and reranked by score, giving a candidate set per layer. Among the layers with the largest summed candidate scores, only those whose overall CLT activity is higher on the forget corpus than on the retain corpus become source layers.

Activation statistics alone do not show whether a feature is specific to the target. Each candidate is therefore reviewed through the WikiText-103 snippets that activate it most. Features that reflect general contexts, syntactic or numeric patterns, or mixed meanings are dropped, and features whose snippets repeatedly show target-specific semantics form the removal set $\mathcal{F}_{\mathrm{rm}}$.

### CLT-guided MLP distillation

Switching CLT features off at inference time would require CLT calls and activation hooks on every forward pass. Instead, the CLT only builds target outputs during training, and those targets are distilled into the MLP weights. Only the MLPs in $\mathcal{T}=\{\ell_{\min},\ldots,L-1\}$, from the earliest source layer to the last layer, are trained; everything else is frozen.

Let $\mathbf{a}^{\ell_s}_{\mathrm{rm}}$ keep only the $\mathcal{F}_{\mathrm{rm}}$ coordinates of the activations at source layer $\ell_s$. Their contribution to a layer $\ell_t \geq \ell_s$ is $\Delta \mathbf{y}_{\mathrm{rm}}^{\ell_s\rightarrow \ell_t} = \mathbf{a}^{\ell_s}_{\mathrm{rm}} W_{\mathrm{dec}}^{\ell_s\rightarrow \ell_t}$. Forget-example targets depend on the kind of layer:

$$\textcolor{#634294}{\widetilde{\mathbf{y}}^{\ell_t}_{\mathrm{rm}}} = \textcolor{#A86A14}{\mathbf{a}^{\ell_t} W_{\mathrm{dec}}^{\ell_t\rightarrow \ell_t}} - \textcolor{#B84327}{\alpha\, \Delta \mathbf{y}_{\mathrm{rm}}^{\ell_t\rightarrow \ell_t}} \quad (\ell_t \in \mathcal{L}_{\mathrm{source}})$$

$$\textcolor{#634294}{\widetilde{\mathbf{y}}^{\ell_t}_{\mathrm{rm}}} = \mathbf{y}^{\ell_t}_{\mathrm{orig}} - \textcolor{#B84327}{\alpha} \sum_{\substack{\ell_s\in\mathcal{L}_{\mathrm{source}}\\ \ell_s<\ell_t}} \textcolor{#B84327}{\Delta \mathbf{y}_{\mathrm{rm}}^{\ell_s\rightarrow \ell_t}} \quad (\ell_t \notin \mathcal{L}_{\mathrm{source}})$$

{{< clt-surgery-widget >}}

At a source layer, the selected features' share is subtracted from the same-layer decoder contribution; with $\alpha=1$ this equals zeroing those features. Other layers keep the original MLP output minus only the contributions sent from selected features at earlier source layers. On retain examples the target is the original model's MLP output $\mathbf{y}_{\mathrm{orig}}$. The two targets are combined in a masked MSE objective:

$$\mathcal{L} = \textcolor{#B84327}{\mathcal{L}_{\mathrm{forget}}} + \lambda\, \textcolor{#2A6F4E}{\mathcal{L}_{\mathrm{retain}}}$$

---

## Results

### Unlearning and retain utility

The target benchmark is WMDP-Bio. Retain utility is measured on MMLU high-school biology (HS Bio), college biology (College Bio), and MMLU-10, which takes 10 questions from each of the 57 MMLU subjects. For GPT-OSS-20B, a sequential-update variant is used: the upstream source-layer MLPs are updated and installed first, and the downstream MLPs are then trained on top of them.

<p class="caption">
Multiple-choice accuracy (%). Bold marks the best value among unlearning methods for each model.
</p>

| Model | Method | WMDP-Bio ↓ | HS Bio ↑ | College Bio ↑ | MMLU-10 ↑ |
|:---|:---|:---:|:---:|:---:|:---:|
| Gemma-2-2B | *Original* | *56.79* | *63.23* | *59.72* | *50.53* |
| | GA | 24.67 | 17.74 | 25.69 | 26.14 |
| | GD | 24.67 | 27.74 | 38.89 | 29.82 |
| | KL | 25.22 | 47.10 | 54.17 | 37.54 |
| | NPO | 45.25 | 60.65 | 56.94 | 45.79 |
| | RMU | **24.35** | 43.87 | 44.44 | 34.56 |
| | CRISP (SAE) | 39.12 | 61.29 | 54.86 | **50.88** |
| | DSG (SAE) | 39.36 | 55.16 | 45.83 | 49.65 |
| | **Ours** | 34.72 | **64.19** | **59.03** | 48.77 |
| GPT-OSS-20B | *Original* | *77.77* | *81.94* | *88.89* | *70.00* |
| | GA | **24.04** | 31.61 | 26.39 | 24.21 |
| | GD | 28.20 | 37.42 | 34.72 | 36.84 |
| | KL | **24.04** | 31.61 | 26.39 | 25.44 |
| | NPO | 38.81 | 37.10 | 39.58 | 37.54 |
| | RMU | 65.51 | 73.87 | 77.78 | 65.96 |
| | **Ours** | 39.67 | **79.68** | **83.33** | **68.60** |

On Gemma-2-2B, WMDP-Bio falls from 56.79% to 34.72%, below the SAE-based CRISP (39.12%) and DSG (39.36%). GA, GD, KL and RMU push WMDP-Bio down to 24–25% but lose more retain accuracy. This method stays close to the original on the retain tests (HS Bio 64.19%, College Bio 59.03%, MMLU-10 48.77%), though CRISP is slightly higher on MMLU-10 (50.88%). On GPT-OSS-20B, WMDP-Bio falls from 77.77% to 39.67%; retain accuracy holds up far better than with GA or GD, and suppression is stronger than with RMU (65.51%). Under 5-shot prompting, WMDP-Bio accuracy for both models also stays well below the original.

### Inside the model

**MLP-output probe.** A linear probe is trained to predict the correct option (A–D) from the MLP output at the final answer position. Comparing probes trained on the original and the unlearned model's MLP outputs shows, layer by layer, how much WMDP-Bio answer information is lost in the MLP outputs we modify; MMLU high-school biology serves as the retain comparison. Together with the generation analysis below, this shows that the learned change is reflected in the modified MLP outputs themselves, not only in the final output.

**Semantic-grouped generation.** Semantic groups are built from the recurring contexts in which the selected features fire on the forget corpus. For each group, short prefixes are written and the original and unlearned models' continuations are compared. Under an LLM judge, target groups show weakened content, while retain-control groups stay near zero or below. The weakening is concentrated in the semantic regions tied to the selected features rather than spread evenly across all prompts.

### Limitations

This method should not be read as a complete biosecurity safeguard. WMDP-Bio is a multiple-choice benchmark and does not capture real-world misuse pathways, adversarial rephrasing, multi-turn elicitation, or relearning. The selected features are reviewed candidates, not a complete causal circuit. The method needs a usable CLT checkpoint, and SAE-based baselines are not reported for GPT-OSS-20B because a comparable SAE could not be trained at that scale.

---
